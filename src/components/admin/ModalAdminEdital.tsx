import React, { useState, useMemo } from 'react';
import { X, CheckCircle, AlertTriangle, Code, Sparkles, Loader2, Database, FileText } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface ModalAdminEditalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditalCreated?: (newEdital?: any) => void;
}

const DEFAULT_JSON_EXAMPLE = `[
  {
    "nome": "LÍNGUA PORTUGUESA",
    "peso": 1.0,
    "topicos": [
      "1 Compreensão e interpretação de textos de gêneros variados.",
      "1.1 Reconhecimento de traços discursivos.",
      "2 Domínio da ortografia oficial.",
      "3 Domínio dos mecanismos de coesão textual."
    ]
  },
  {
    "nome": "CONHECIMENTOS ESPECÍFICOS",
    "peso": 2.0,
    "topicos": [
      "1 Noções de Administração Pública e Constitucional.",
      "2 Regime Jurídico Único dos Servidores.",
      "3 Ética e responsabilidade no serviço público."
    ]
  }
]`;

export const ModalAdminEdital: React.FC<ModalAdminEditalProps> = ({
  isOpen,
  onClose,
  onEditalCreated,
}) => {
  const [titulo, setTitulo] = useState('');
  const [orgao, setOrgao] = useState('');
  const [cargo, setCargo] = useState('');
  const [banca, setBanca] = useState('');
  const [esfera, setEsfera] = useState<'Federal' | 'Estadual' | 'Municipal' | 'Distrital'>('Municipal');
  const [escolaridade, setEscolaridade] = useState<'Fundamental' | 'Médio' | 'Superior'>('Superior');
  const [vagas, setVagas] = useState<number | string>(1);
  const [salarioMaximo, setSalarioMaximo] = useState<string>('');
  const [dataProva, setDataProva] = useState<string>('');
  const [status, setStatus] = useState<'Previsto' | 'Autorizado' | 'Edital Publicado'>('Edital Publicado');
  const [observacoes, setObservacoes] = useState('');
  const [materiasJson, setMateriasJson] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Validação em tempo real do JSON de matérias
  const jsonStatus = useMemo(() => {
    const trimmed = materiasJson.trim();
    if (!trimmed) {
      return { isValid: false, message: 'Cole o array JSON com a grade programática.', count: 0, topicosCount: 0 };
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        return { isValid: false, message: 'O JSON deve ser um array [] de matérias.', count: 0, topicosCount: 0 };
      }
      if (parsed.length === 0) {
        return { isValid: false, message: 'O array JSON está vazio.', count: 0, topicosCount: 0 };
      }

      let totalTopicos = 0;
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (typeof item !== 'object' || item === null) {
          return { isValid: false, message: `Item #${i + 1} não é um objeto válido.`, count: 0, topicosCount: 0 };
        }
        if (!item.nome && !item.materia && !item.disciplina) {
          return { isValid: false, message: `Item #${i + 1} precisa conter a propriedade "nome".`, count: 0, topicosCount: 0 };
        }
        if (Array.isArray(item.topicos)) {
          totalTopicos += item.topicos.length;
        }
      }

      return {
        isValid: true,
        message: `${parsed.length} matéria(s) e ${totalTopicos} tópico(s) detectados.`,
        count: parsed.length,
        topicosCount: totalTopicos,
      };
    } catch (err: any) {
      return {
        isValid: false,
        message: `Sintaxe inválida: ${err.message || 'Verifique vírgulas e aspas.'}`,
        count: 0,
        topicosCount: 0,
      };
    }
  }, [materiasJson]);

  // Se o modal não estiver aberto, não renderiza
  if (!isOpen) return null;

  const handleInsertExample = () => {
    setMateriasJson(DEFAULT_JSON_EXAMPLE);
    setErrorMessage(null);
  };

  const handleFormatJson = () => {
    try {
      if (!materiasJson.trim()) return;
      const parsed = JSON.parse(materiasJson);
      setMateriasJson(JSON.stringify(parsed, null, 2));
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(`Não foi possível formatar o JSON: ${err.message}`);
    }
  };

  const handleClearForm = () => {
    setTitulo('');
    setOrgao('');
    setCargo('');
    setBanca('');
    setEsfera('Municipal');
    setEscolaridade('Superior');
    setVagas(1);
    setSalarioMaximo('');
    setDataProva('');
    setStatus('Edital Publicado');
    setObservacoes('');
    setMateriasJson('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validações básicas de campos obrigatórios
    if (!titulo.trim()) {
      setErrorMessage('O Título do Certame é obrigatório.');
      return;
    }
    if (!orgao.trim()) {
      setErrorMessage('O Órgão / Instituição é obrigatório.');
      return;
    }
    if (!cargo.trim()) {
      setErrorMessage('O Cargo Pretendido é obrigatório.');
      return;
    }

    // Validação estrita do JSON de matérias
    if (!materiasJson.trim()) {
      setErrorMessage('O campo Matérias & Conteúdo Programático (JSONB) é obrigatório.');
      return;
    }

    let parsedMaterias: any[] = [];
    try {
      const parsed = JSON.parse(materiasJson);
      if (!Array.isArray(parsed)) {
        setErrorMessage('O conteúdo de Matérias deve ser estritamente um array JSON ([]). Abortando envio.');
        return;
      }
      parsedMaterias = parsed;
    } catch (parseError: any) {
      setErrorMessage(`JSON inválido: ${parseError.message}. Corrija a formatação antes de enviar.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        titulo: titulo.trim(),
        orgao: orgao.trim(),
        cargo: cargo.trim(),
        banca: banca.trim() || 'A Definir',
        vagas: Number(vagas) || 1,
        salario_maximo: salarioMaximo ? Number(salarioMaximo) : null,
        escolaridade,
        esfera,
        status,
        data_prova: dataProva || null,
        observacoes: observacoes.trim() || null,
        materias: parsedMaterias,
      };

      console.log('Inserindo edital diretamente no Supabase:', payload);

      // 1. Inserção direta via Supabase Client
      const { data, error } = await supabase
        .from('editais')
        .insert([payload])
        .select();

      if (error) {
        console.error('Erro retornado pelo Supabase:', error);
        // Tenta fallback via backend se existir
        const fallbackRes = await fetch('/api/editais', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => null);

        if (fallbackRes && fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          console.log('Inserção bem-sucedida via fallback backend:', fallbackData);
        } else {
          throw new Error(error.message || 'Falha ao gravar no Supabase');
        }
      } else {
        console.log('Edital inserido com sucesso no Supabase:', data);
      }

      setSuccessMessage('Edital cadastrado com sucesso no Supabase!');

      // Notifica o app e listeners globais
      window.dispatchEvent(new CustomEvent('gabarita_edital_created', { detail: payload }));
      window.dispatchEvent(new CustomEvent('gabarita_concursos_updated'));
      if (onEditalCreated) {
        onEditalCreated(data?.[0] || payload);
      }

      // Aguarda 1.2s para exibir mensagem de sucesso antes de fechar e limpar
      setTimeout(() => {
        handleClearForm();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Erro na submissão do edital:', err);
      setErrorMessage(`Erro ao cadastrar edital: ${err.message || 'Verifique as permissões do Supabase.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>⚙️ Cadastrar Edital Manualmente</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
                  Admin
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Gravação direta na tabela <code className="text-emerald-300 font-mono">editais</code> do Supabase.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Formulário com Scroll Interno */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Mensagens de Feedback */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 text-xs sm:text-sm animate-in fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="font-semibold">{successMessage}</div>
            </div>
          )}

          {/* Grid de Campos Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Título do Certame */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Título do Certame <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Pref. Aparecida de Goiânia - 2026 - Agente Educativo"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            {/* Órgão / Instituição */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Órgão / Instituição <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={orgao}
                onChange={(e) => setOrgao(e.target.value)}
                placeholder="Ex: Prefeitura de Aparecida de Goiânia - GO"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            {/* Cargo Pretendido */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cargo Pretendido <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Agente Educativo"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            {/* Banca Examinadora */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Banca Examinadora
              </label>
              <input
                type="text"
                value={banca}
                onChange={(e) => setBanca(e.target.value)}
                placeholder="Ex: Instituto Verbena / UFG"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            {/* Esfera */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Esfera
              </label>
              <select
                value={esfera}
                onChange={(e) => setEsfera(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-100 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              >
                <option value="Municipal">Municipal</option>
                <option value="Estadual">Estadual</option>
                <option value="Federal">Federal</option>
                <option value="Distrital">Distrital</option>
              </select>
            </div>

            {/* Escolaridade */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Escolaridade
              </label>
              <select
                value={escolaridade}
                onChange={(e) => setEscolaridade(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-100 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              >
                <option value="Fundamental">Fundamental</option>
                <option value="Médio">Médio</option>
                <option value="Superior">Superior</option>
              </select>
            </div>

            {/* Vagas */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vagas
              </label>
              <input
                type="number"
                min="0"
                value={vagas}
                onChange={(e) => setVagas(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-100 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            {/* Remuneração / Salário Máximo */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Remuneração / Salário Máximo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={salarioMaximo}
                onChange={(e) => setSalarioMaximo(e.target.value)}
                placeholder="Ex: 3450.00"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            {/* Data da Prova */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Data da Prova
              </label>
              <input
                type="date"
                value={dataProva}
                onChange={(e) => setDataProva(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-100 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            {/* Situação / Status */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Situação / Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-100 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              >
                <option value="Edital Publicado">Edital Publicado</option>
                <option value="Autorizado">Autorizado</option>
                <option value="Previsto">Previsto</option>
                <option value="Inscrições Abertas">Inscrições Abertas</option>
                <option value="Encerrado">Encerrado</option>
              </select>
            </div>

            {/* Observações / Estratégia */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Observações / Estratégia (Opcional)
              </label>
              <textarea
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Foco nas matérias específicas; prova com peso dobrado em Legislação..."
                className="w-full px-3.5 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-y"
              />
            </div>
          </div>

          {/* Campo JSONB de Matérias */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Matérias & Conteúdo Programático (JSONB) <span className="text-rose-400">*</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Formato array <code className="text-emerald-300 font-mono">[&#123; "nome": "...", "peso": 1.0, "topicos": [...] &#125;]</code>
                </p>
              </div>

              {/* Botões de Apoio */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleInsertExample}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/40 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Inserir Exemplo</span>
                </button>
                <button
                  type="button"
                  onClick={handleFormatJson}
                  disabled={!materiasJson.trim()}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Code className="w-3 h-3" />
                  <span>Formatar JSON</span>
                </button>
              </div>
            </div>

            {/* Textarea Mono */}
            <div className="relative">
              <textarea
                required
                rows={8}
                value={materiasJson}
                onChange={(e) => setMateriasJson(e.target.value)}
                placeholder={DEFAULT_JSON_EXAMPLE}
                className="w-full p-3 font-mono text-xs rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors custom-scrollbar"
                spellCheck={false}
              />
            </div>

            {/* Badge de Validação em Tempo Real */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1.5">
                {jsonStatus.isValid ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {jsonStatus.message}
                  </span>
                ) : materiasJson.trim() ? (
                  <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {jsonStatus.message}
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Insira ou cole o JSON extraído pelo assistente.
                  </span>
                )}
              </div>
              {jsonStatus.isValid && (
                <span className="text-[11px] font-mono text-slate-400">
                  {jsonStatus.count} disciplinas | {jsonStatus.topicosCount} tópicos
                </span>
              )}
            </div>
          </div>
        </form>

        {/* Rodapé com Ações */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleClearForm}
            disabled={isSubmitting}
            className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Limpar Campos
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !jsonStatus.isValid}
              className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gravando no Supabase...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Salvar Edital no Supabase</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
