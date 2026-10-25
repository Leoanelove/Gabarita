// Setup type definitions for Deno environment
// Follows standard Supabase Edge Runtime conventions

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

interface EditalDisciplina {
  materia: string;
  bloco: string;
  topicos: string[];
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Converte Uint8Array para base64 com suporte a arquivos grandes sem estourar a pilha
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 0x8000; // 32KB chunks
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

// Helpers para codificação Base64URL no padrão JWT (RFC 7519)
function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return base64UrlEncodeBytes(bytes);
}

// Gera um Access Token OAuth2 do Google via Web Crypto API (Deno nativo)
async function getGoogleDriveAccessToken(serviceAccount: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
  const dataToSign = new TextEncoder().encode(`${encodedHeader}.${encodedClaimSet}`);

  // Limpa o cabeçalho e rodapé da chave privada PEM
  const pem = serviceAccount.private_key
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');

  const binaryDer = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' },
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    cryptoKey,
    dataToSign
  );

  const encodedSignature = base64UrlEncodeBytes(new Uint8Array(signature));
  const jwtAssertion = `${encodedHeader}.${encodedClaimSet}.${encodedSignature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwtAssertion,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Falha na autenticação do Google Drive OAuth: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Download do primeiro arquivo PDF da pasta indicada no Google Drive
async function downloadFirstPdfFromDrive(accessToken: string, folderId: string): Promise<{ fileName: string; fileBytes: Uint8Array }> {
  // Busca o primeiro PDF na pasta do Google Drive
  const query = encodeURIComponent(`'${folderId}' in parents and mimeType = 'application/pdf' and trashed = false`);
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType)&pageSize=1`;

  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    const err = await listRes.text();
    throw new Error(`Erro ao listar arquivos da pasta do Google Drive: ${err}`);
  }

  const listData = await listRes.json();
  const files = listData.files || [];

  if (files.length === 0) {
    // Tentativa alternativa caso o mimeType esteja genérico na pasta
    const fallbackQuery = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fallbackRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${fallbackQuery}&fields=files(id,name,mimeType)&pageSize=5`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const fallbackData = await fallbackRes.json();
    const candidate = (fallbackData.files || []).find((f: any) => 
      f.mimeType === 'application/pdf' || String(f.name).toLowerCase().endsWith('.pdf')
    );

    if (!candidate) {
      throw new Error(`Nenhum arquivo PDF encontrado na pasta com ID: ${folderId}`);
    }
    files.push(candidate);
  }

  const targetFile = files[0];
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${targetFile.id}?alt=media`;

  const downloadRes = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!downloadRes.ok) {
    const err = await downloadRes.text();
    throw new Error(`Falha ao baixar o arquivo PDF (${targetFile.name}): ${err}`);
  }

  const arrayBuffer = await downloadRes.arrayBuffer();
  return {
    fileName: targetFile.name,
    fileBytes: new Uint8Array(arrayBuffer),
  };
}

// Extração do Conteúdo Programático com Gemini 1.5 Flash
async function processarEditalComGemini(pdfBytes: Uint8Array, geminiApiKey: string): Promise<EditalDisciplina[]> {
  const base64Pdf = uint8ArrayToBase64(pdfBytes);

  const prompt = `Você é um especialista em concursos públicos brasileiros e análise detalhada de editais.
Analise o arquivo PDF anexo deste edital de concurso público e extraia integralmente todo o CONTEÚDO PROGRAMÁTICO (disciplinas, matérias e seus respectivos tópicos / objetos de conhecimento).

🚨 REGRAS ESTRITAS DE FORMATAÇÃO E ESTRUTURA:
1. Retorne ESTRITAMENTE um Array JSON de Objetos (sem marcações markdown como \`\`\`json ou \`\`\`).
2. Cada objeto no Array representa uma matéria/disciplina e deve conter EXATAMENTE as seguintes 3 chaves:
   - "materia": string com o nome da disciplina (ex: "Língua Portuguesa", "Direito Constitucional", "Raciocínio Lógico-Matemático", "Auditoria Governamental").
   - "bloco": string indicando o grupo ao qual pertence (use rigorosamente "Conhecimentos Gerais" ou "Conhecimentos Específicos", conforme a divisão expressa no edital).
   - "topicos": array de strings, onde cada string é um item, assunto ou tópico da matéria extraído do edital, quebrado por pontos e vírgulas (ex: ["Compreensão e interpretação de textos de gêneros variados", "Reconhecimento de tipos e gêneros textuais", "Domínio da ortografia oficial"]).

3. REGRA DE NÃO REGRESSÃO:
   NÃO adicione, NÃO remova e NÃO renomeie nenhuma dessas chaves ("materia", "bloco", "topicos").
   Não inclua introduções, explicações ou qualquer texto fora do JSON.`;

  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Pdf,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  };

  const response = await fetch(geminiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Erro na chamada da API Gemini (${response.status}): ${errorBody}`);
  }

  const geminiResult = await response.json();
  const rawText = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('A API Gemini não retornou conteúdo textual no resultado.');
  }

  // Sanitização de segurança caso retorne com blocos markdown
  const cleanedText = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (err: any) {
    throw new Error(`Falha ao decodificar JSON retornado pelo Gemini: ${err.message}. Texto recebido: ${cleanedText.slice(0, 300)}`);
  }

  // Se o modelo envelopar em um objeto como { materias: [...] } ou { disciplinas: [...] }
  let disciplinasArray: any[] = [];
  if (Array.isArray(parsed)) {
    disciplinasArray = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.materias)) disciplinasArray = parsed.materias;
    else if (Array.isArray(parsed.disciplinas)) disciplinasArray = parsed.disciplinas;
    else if (Array.isArray(parsed.conteudo_programatico)) disciplinasArray = parsed.conteudo_programatico;
    else if (Array.isArray(parsed.items)) disciplinasArray = parsed.items;
  }

  if (!Array.isArray(disciplinasArray) || disciplinasArray.length === 0) {
    throw new Error('Nenhuma disciplina válida foi extraída do edital.');
  }

  // Validação e blindagem da estrutura exata (materia, bloco, topicos)
  const sanitizedOutput: EditalDisciplina[] = disciplinasArray.map((item: any, idx: number) => {
    const materia = String(item.materia || item.disciplina || item.nome || `Disciplina ${idx + 1}`).trim();
    const bloco = String(item.bloco || (item.conhecimento ? String(item.conhecimento) : 'Conhecimentos Gerais')).trim();
    
    let topicos: string[] = [];
    if (Array.isArray(item.topicos)) {
      topicos = item.topicos
        .map((t: any) => String(t).trim())
        .filter((t: string) => t.length > 0);
    } else if (typeof item.topicos === 'string') {
      topicos = item.topicos
        .split(/[;•\n]/)
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);
    }

    return {
      materia,
      bloco,
      topicos,
    };
  });

  return sanitizedOutput;
}

// Handler da Supabase Edge Function (Deno Runtime)
Deno.serve(async (req: Request) => {
  // Tratamento de preflight CORS (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // 1. Puxar credenciais salvas no ambiente
    const serviceAccountRaw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!serviceAccountRaw) {
      return new Response(
        JSON.stringify({ error: 'Variável de ambiente GOOGLE_SERVICE_ACCOUNT não configurada.' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Variável de ambiente GEMINI_API_KEY não configurada.' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    let serviceAccount: ServiceAccountKey;
    try {
      serviceAccount = JSON.parse(serviceAccountRaw);
    } catch {
      try {
        serviceAccount = JSON.parse(atob(serviceAccountRaw));
      } catch {
        return new Response(
          JSON.stringify({ error: 'Variável GOOGLE_SERVICE_ACCOUNT não é um JSON válido de conta de serviço.' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. Autenticar na API do Google Drive e baixar o 1º PDF da pasta informada
    const folderId = '1lqUNh9Z_EVYmtKrbxh1k2LU2QFUu-CrN';
    const driveAccessToken = await getGoogleDriveAccessToken(serviceAccount);
    const { fileName, fileBytes } = await downloadFirstPdfFromDrive(driveAccessToken, folderId);

    console.log(`[ProcessEdital] PDF baixado com sucesso: ${fileName} (${fileBytes.byteLength} bytes)`);

    // 3. Enviar PDF para a API do Gemini (gemini-1.5-flash) e extrair conteúdo programático
    const resultadoFinal = await processarEditalComGemini(fileBytes, geminiApiKey);

    console.log(`[ProcessEdital] Concluído! Extraídas ${resultadoFinal.length} matérias.`);

    // 4. Retornar rigorosamente o JSON final com status 200
    return new Response(JSON.stringify(resultadoFinal), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('[ProcessEdital] Erro na execução:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro interno ao processar edital.',
      }),
      {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
