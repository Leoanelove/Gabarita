import React from 'react';
import {
  BookOpen,
  Languages,
  Calculator,
  Coins,
  Landmark,
  Scale,
  Building2,
  ShieldCheck,
  ReceiptText,
  Gavel,
  FileSearch,
  Files,
  WalletCards,
  Banknote,
  ChartNoAxesCombined,
  ClipboardList,
  TrendingUp,
  BarChart3,
  Monitor,
  Laptop,
  Cpu,
  LockKeyhole,
  Database,
  BrainCircuit,
  Newspaper,
  Globe2,
  ScrollText,
  Map,
  HeartHandshake,
  HandHeart,
  UsersRound,
  BriefcaseBusiness,
  Boxes,
  FileCheck2,
  PenLine,
  PenSquare,
  Archive,
  BookMarked,
  TrafficCone,
  Car,
  HeartPulse,
  UserRoundCog,
  Workflow,
  FolderKanban,
  Truck,
  Route,
  Leaf,
  Hospital,
  Stethoscope,
  CandlestickChart,
  Ship,
  Shield,
  SearchCheck,
  Fingerprint,
  Microscope,
  HardHat,
  Ruler,
  GraduationCap,
  Hand,
  FileText,
  Layers3,
  CircleHelp,
  Sparkles,
  LucideIcon,
} from 'lucide-react';

export interface SubjectIconConfig {
  icon: LucideIcon;
  color: string; // Hex color for consistent subtle badge styling
}

// Paleta de cores suaves e consistentes por categoria:
// - Português: azul (#2563EB)
// - Matemática e raciocínio lógico: roxo (#7C3AED)
// - Direito: azul-marinho / verde-azulado (#0D9488 / #1E40AF)
// - Administração: verde (#10B981)
// - Contabilidade e economia: âmbar / teal (#D97706 / #0D9488)
// - Tecnologia: ciano / azul (#0891B2 / #0284C7)
// - Conhecimentos gerais: laranja / amarelo (#EA580C / #D97706)
// - Saúde e primeiros socorros: vermelho suave (#E11D48)
// - Educação e idiomas: lilás (#9333EA)
// - Matérias específicas: cinza-violeta (#6366F1)
const CATEGORY_COLORS = {
  portugues: '#2563EB',
  matematica: '#7C3AED',
  direito: '#0D9488',
  direitoMarinho: '#1E40AF',
  administracao: '#10B981',
  contabilidade: '#D97706',
  economia: '#0D9488',
  tecnologia: '#0891B2',
  gerais: '#EA580C',
  saude: '#E11D48',
  educacaoIdiomas: '#9333EA',
  especificas: '#6366F1',
};

/**
 * Normaliza o nome da matéria removendo acentos, espaços extras e convertendo para minúsculas.
 */
export function normalizeSubjectName(name: string): string {
  return (name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Mapeamento completo entre as 58 matérias padrão e seus respectivos ícones e cores.
 * Para alterar ou adicionar novos ícones, basta incluir ou editar uma entrada neste objeto.
 */
export const SUBJECT_ICON_MAP: Record<string, SubjectIconConfig> = {
  // 1. Língua Portuguesa
  'lingua portuguesa': { icon: BookOpen, color: CATEGORY_COLORS.portugues },
  'portugues': { icon: BookOpen, color: CATEGORY_COLORS.portugues },
  'gramatica': { icon: BookOpen, color: CATEGORY_COLORS.portugues },
  'interpretacao de textos': { icon: BookOpen, color: CATEGORY_COLORS.portugues },

  // 2. Raciocínio Lógico e Matemática
  'raciocinio logico e matematica': { icon: Calculator, color: CATEGORY_COLORS.matematica },
  'raciocinio logico': { icon: Calculator, color: CATEGORY_COLORS.matematica },
  'raciocinio logico-matematico': { icon: Calculator, color: CATEGORY_COLORS.matematica },
  'matematica': { icon: Calculator, color: CATEGORY_COLORS.matematica },
  'raciocinio logico e matematica financeira': { icon: Calculator, color: CATEGORY_COLORS.matematica },

  // 3. Matemática Financeira
  'matematica financeira': { icon: Coins, color: CATEGORY_COLORS.matematica },

  // 4. Direito Constitucional
  'direito constitucional': { icon: Landmark, color: CATEGORY_COLORS.direito },
  'nocoes de direito constitucional': { icon: Landmark, color: CATEGORY_COLORS.direito },

  // 5. Direito Administrativo
  'direito administrativo': { icon: Scale, color: CATEGORY_COLORS.direito },
  'nocoes de direito administrativo': { icon: Scale, color: CATEGORY_COLORS.direito },

  // 6. Direito Previdenciário
  'direito previdenciario': { icon: ShieldCheck, color: CATEGORY_COLORS.direito },
  'seguridade social': { icon: ShieldCheck, color: CATEGORY_COLORS.direito },

  // 7. Direito Tributário
  'direito tributario': { icon: ReceiptText, color: CATEGORY_COLORS.direitoMarinho },
  'legislacao tributaria': { icon: ReceiptText, color: CATEGORY_COLORS.direitoMarinho },

  // 8. Direito Penal
  'direito penal': { icon: Gavel, color: CATEGORY_COLORS.direitoMarinho },
  'direito penal militar': { icon: Gavel, color: CATEGORY_COLORS.direitoMarinho },

  // 9. Processo Penal
  'processo penal': { icon: FileSearch, color: CATEGORY_COLORS.direitoMarinho },
  'direito processual penal': { icon: FileSearch, color: CATEGORY_COLORS.direitoMarinho },

  // 10. Direito Civil
  'direito civil': { icon: Scale, color: CATEGORY_COLORS.direito },

  // 11. Processo Civil
  'processo civil': { icon: Files, color: CATEGORY_COLORS.direito },
  'direito processual civil': { icon: Files, color: CATEGORY_COLORS.direito },

  // 12. Administração Pública
  'administracao publica': { icon: Building2, color: CATEGORY_COLORS.administracao },
  'administracao geral e publica': { icon: Building2, color: CATEGORY_COLORS.administracao },
  'administracao geral': { icon: Building2, color: CATEGORY_COLORS.administracao },
  'nocoes de administracao': { icon: Building2, color: CATEGORY_COLORS.administracao },

  // 13. Administração Financeira e Orçamentária
  'administracao financeira e orcamentaria': { icon: WalletCards, color: CATEGORY_COLORS.administracao },
  'afo': { icon: WalletCards, color: CATEGORY_COLORS.administracao },
  'orcamento publico': { icon: Banknote, color: CATEGORY_COLORS.administracao },

  // 14. Contabilidade Geral
  'contabilidade geral': { icon: ChartNoAxesCombined, color: CATEGORY_COLORS.contabilidade },
  'contabilidade': { icon: ChartNoAxesCombined, color: CATEGORY_COLORS.contabilidade },

  // 15. Contabilidade Pública
  'contabilidade publica': { icon: ClipboardList, color: CATEGORY_COLORS.contabilidade },

  // 16. Economia
  'economia': { icon: TrendingUp, color: CATEGORY_COLORS.economia },
  'microeconomia': { icon: TrendingUp, color: CATEGORY_COLORS.economia },
  'macroeconomia': { icon: TrendingUp, color: CATEGORY_COLORS.economia },

  // 17. Estatística
  'estatistica': { icon: BarChart3, color: CATEGORY_COLORS.matematica },
  'probabilidade e estatistica': { icon: BarChart3, color: CATEGORY_COLORS.matematica },

  // 18. Informática
  'informatica': { icon: Monitor, color: CATEGORY_COLORS.tecnologia },
  'nocoes de informatica': { icon: Monitor, color: CATEGORY_COLORS.tecnologia },
  'conhecimentos de informatica': { icon: Laptop, color: CATEGORY_COLORS.tecnologia },

  // 19. Tecnologia da Informação
  'tecnologia da informacao': { icon: Cpu, color: CATEGORY_COLORS.tecnologia },
  'ti': { icon: Cpu, color: CATEGORY_COLORS.tecnologia },

  // 20. Segurança da Informação
  'seguranca da informacao': { icon: LockKeyhole, color: CATEGORY_COLORS.tecnologia },

  // 21. Análise de Dados
  'analise de dados': { icon: Database, color: CATEGORY_COLORS.tecnologia },
  'ciencia de dados': { icon: Database, color: CATEGORY_COLORS.tecnologia },

  // 22. Inteligência Artificial
  'inteligencia artificial': { icon: BrainCircuit, color: CATEGORY_COLORS.tecnologia },

  // 23. Atualidades
  'atualidades': { icon: Newspaper, color: CATEGORY_COLORS.gerais },
  'atualidades do mercado financeiro': { icon: Newspaper, color: CATEGORY_COLORS.gerais },

  // 24. Conhecimentos Gerais
  'conhecimentos gerais': { icon: Globe2, color: CATEGORY_COLORS.gerais },
  'conhecimentos do distrito federal': { icon: Globe2, color: CATEGORY_COLORS.gerais },
  'realidade brasileira': { icon: Globe2, color: CATEGORY_COLORS.gerais },

  // 25. História
  'historia': { icon: ScrollText, color: CATEGORY_COLORS.gerais },
  'historia do brasil': { icon: ScrollText, color: CATEGORY_COLORS.gerais },

  // 26. Geografia
  'geografia': { icon: Map, color: CATEGORY_COLORS.gerais },
  'geografia do brasil': { icon: Map, color: CATEGORY_COLORS.gerais },

  // 27. Direitos Humanos
  'direitos humanos': { icon: HeartHandshake, color: CATEGORY_COLORS.direito },

  // 28. Ética no Serviço Público
  'etica no servico publico': { icon: HandHeart, color: CATEGORY_COLORS.administracao },
  'etica': { icon: HandHeart, color: CATEGORY_COLORS.administracao },
  'etica e integridade': { icon: HandHeart, color: CATEGORY_COLORS.administracao },

  // 29. Gestão de Pessoas
  'gestao de pessoas': { icon: UsersRound, color: CATEGORY_COLORS.administracao },

  // 30. Gestão Pública
  'gestao publica': { icon: BriefcaseBusiness, color: CATEGORY_COLORS.administracao },

  // 31. Administração de Materiais
  'administracao de materiais': { icon: Boxes, color: CATEGORY_COLORS.administracao },
  'administracao de recursos materiais': { icon: Boxes, color: CATEGORY_COLORS.administracao },

  // 32. Licitações e Contratos
  'licitacoes e contratos': { icon: FileCheck2, color: CATEGORY_COLORS.direito },
  'licitacoes': { icon: FileCheck2, color: CATEGORY_COLORS.direito },

  // 33. Redação Oficial
  'redacao oficial': { icon: PenLine, color: CATEGORY_COLORS.portugues },
  'correspondencia oficial': { icon: PenLine, color: CATEGORY_COLORS.portugues },

  // 34. Redação e Discursiva
  'redacao e discursiva': { icon: PenSquare, color: CATEGORY_COLORS.portugues },
  'redacao': { icon: PenSquare, color: CATEGORY_COLORS.portugues },
  'discursiva': { icon: PenSquare, color: CATEGORY_COLORS.portugues },

  // 35. Arquivologia
  'arquivologia': { icon: Archive, color: CATEGORY_COLORS.administracao },
  'nocoes de arquivologia': { icon: Archive, color: CATEGORY_COLORS.administracao },

  // 36. Regimento Interno
  'regimento interno': { icon: ScrollText, color: CATEGORY_COLORS.direito },
  'lei organica do tcdf e regimento interno': { icon: ScrollText, color: CATEGORY_COLORS.direito },

  // 37. Legislação Específica
  'legislacao especifica': { icon: BookMarked, color: CATEGORY_COLORS.direito },
  'lei organica': { icon: BookMarked, color: CATEGORY_COLORS.direito },
  'lei organica do distrito federal': { icon: BookMarked, color: CATEGORY_COLORS.direito },

  // 38. Legislação de Trânsito
  'legislacao de transito': { icon: TrafficCone, color: CATEGORY_COLORS.direitoMarinho },
  'transito': { icon: Car, color: CATEGORY_COLORS.direitoMarinho },

  // 39. Primeiros Socorros
  'primeiros socorros': { icon: HeartPulse, color: CATEGORY_COLORS.saude },
  'nocoes de primeiros socorros': { icon: HeartPulse, color: CATEGORY_COLORS.saude },

  // 40. Administração de Recursos Humanos
  'administracao de recursos humanos': { icon: UserRoundCog, color: CATEGORY_COLORS.administracao },

  // 41. Gestão de Projetos
  'gestao de projetos': { icon: Workflow, color: CATEGORY_COLORS.administracao },
  'gestao de processos': { icon: FolderKanban, color: CATEGORY_COLORS.administracao },

  // 42. Logística
  'logistica': { icon: Truck, color: CATEGORY_COLORS.administracao },
  'transporte e logistica': { icon: Route, color: CATEGORY_COLORS.administracao },

  // 43. Meio Ambiente
  'meio ambiente': { icon: Leaf, color: CATEGORY_COLORS.administracao },
  'direito ambiental': { icon: Leaf, color: CATEGORY_COLORS.direito },
  'sustentabilidade': { icon: Leaf, color: CATEGORY_COLORS.administracao },

  // 44. Saúde Pública
  'saude publica': { icon: Hospital, color: CATEGORY_COLORS.saude },
  'legislacao do sus': { icon: Stethoscope, color: CATEGORY_COLORS.saude },
  'enfermagem': { icon: Stethoscope, color: CATEGORY_COLORS.saude },

  // 45. Conhecimentos Bancários
  'conhecimentos bancarios': { icon: Banknote, color: CATEGORY_COLORS.contabilidade },

  // 46. Mercado Financeiro
  'mercado financeiro': { icon: CandlestickChart, color: CATEGORY_COLORS.economia },
  'vendas e negociacao': { icon: TrendingUp, color: CATEGORY_COLORS.administracao },

  // 47. Comércio Exterior
  'comercio exterior': { icon: Ship, color: CATEGORY_COLORS.economia },
  'comercio internacional': { icon: Globe2, color: CATEGORY_COLORS.economia },

  // 48. Segurança Pública
  'seguranca publica': { icon: Shield, color: CATEGORY_COLORS.direitoMarinho },
  'defesa civil': { icon: Shield, color: CATEGORY_COLORS.direitoMarinho },

  // 49. Criminologia
  'criminologia': { icon: Fingerprint, color: CATEGORY_COLORS.direitoMarinho },
  'investigacao criminal': { icon: SearchCheck, color: CATEGORY_COLORS.direitoMarinho },

  // 50. Medicina Legal
  'medicina legal': { icon: Microscope, color: CATEGORY_COLORS.saude },

  // 51. Engenharia
  'engenharia': { icon: HardHat, color: CATEGORY_COLORS.especificas },
  'engenharia civil': { icon: HardHat, color: CATEGORY_COLORS.especificas },

  // 52. Arquitetura
  'arquitetura': { icon: Ruler, color: CATEGORY_COLORS.especificas },

  // 53. Pedagogia
  'pedagogia': { icon: GraduationCap, color: CATEGORY_COLORS.educacaoIdiomas },
  'conhecimentos pedagogicos': { icon: GraduationCap, color: CATEGORY_COLORS.educacaoIdiomas },

  // 54. Legislação Educacional
  'legislacao educacional': { icon: BookMarked, color: CATEGORY_COLORS.educacaoIdiomas },

  // 55. Língua Inglesa
  'lingua inglesa': { icon: Languages, color: CATEGORY_COLORS.educacaoIdiomas },
  'ingles': { icon: Languages, color: CATEGORY_COLORS.educacaoIdiomas },

  // 56. Língua Espanhola
  'lingua espanhola': { icon: Languages, color: CATEGORY_COLORS.educacaoIdiomas },
  'espanhol': { icon: Languages, color: CATEGORY_COLORS.educacaoIdiomas },

  // 57. Libras
  'libras': { icon: Hand, color: CATEGORY_COLORS.educacaoIdiomas },

  // 58. Disciplina Específica do Cargo
  'disciplina especifica do cargo': { icon: Layers3, color: CATEGORY_COLORS.especificas },
  'conhecimentos especificos': { icon: Layers3, color: CATEGORY_COLORS.especificas },
};

/**
 * Resolve o ícone e a cor de uma matéria com correspondência exata, por palavra-chave ou fallback inteligente.
 */
export function resolveSubjectIcon(subjectName: string): SubjectIconConfig {
  const normalized = normalizeSubjectName(subjectName);

  if (!normalized) {
    return { icon: CircleHelp, color: CATEGORY_COLORS.especificas };
  }

  // 1. Correspondência exata no mapa
  if (SUBJECT_ICON_MAP[normalized]) {
    return SUBJECT_ICON_MAP[normalized];
  }

  // 2. Correspondência parcial por palavras-chave principais das 58 matérias
  if (normalized.includes('portugues') || normalized.includes('gramatica') || normalized.includes('texto')) {
    return { icon: BookOpen, color: CATEGORY_COLORS.portugues };
  }
  if (normalized.includes('redacao oficial') || normalized.includes('correspondencia')) {
    return { icon: PenLine, color: CATEGORY_COLORS.portugues };
  }
  if (normalized.includes('redacao') || normalized.includes('discursiva')) {
    return { icon: PenSquare, color: CATEGORY_COLORS.portugues };
  }
  if (normalized.includes('ingles') || normalized.includes('espanhol') || normalized.includes('frances') || normalized.includes('idioma') || normalized.includes('lingua estrangeira')) {
    return { icon: Languages, color: CATEGORY_COLORS.educacaoIdiomas };
  }
  if (normalized.includes('libras')) {
    return { icon: Hand, color: CATEGORY_COLORS.educacaoIdiomas };
  }
  if (normalized.includes('matematica financeira') || normalized.includes('juros')) {
    return { icon: Coins, color: CATEGORY_COLORS.matematica };
  }
  if (normalized.includes('raciocinio') || normalized.includes('logico') || normalized.includes('matematica') || normalized.includes('calculo')) {
    return { icon: Calculator, color: CATEGORY_COLORS.matematica };
  }
  if (normalized.includes('estatistica') || normalized.includes('probabilidade')) {
    return { icon: BarChart3, color: CATEGORY_COLORS.matematica };
  }
  if (normalized.includes('constitucional')) {
    return { icon: Landmark, color: CATEGORY_COLORS.direito };
  }
  if (normalized.includes('previdenciario') || normalized.includes('seguridade')) {
    return { icon: ShieldCheck, color: CATEGORY_COLORS.direito };
  }
  if (normalized.includes('tributario') || normalized.includes('fiscal')) {
    return { icon: ReceiptText, color: CATEGORY_COLORS.direitoMarinho };
  }
  if (normalized.includes('processo penal') || normalized.includes('processual penal')) {
    return { icon: FileSearch, color: CATEGORY_COLORS.direitoMarinho };
  }
  if (normalized.includes('penal')) {
    return { icon: Gavel, color: CATEGORY_COLORS.direitoMarinho };
  }
  if (normalized.includes('processo civil') || normalized.includes('processual civil')) {
    return { icon: Files, color: CATEGORY_COLORS.direito };
  }
  if (normalized.includes('direito administrativo')) {
    return { icon: Scale, color: CATEGORY_COLORS.direito };
  }
  if (normalized.includes('direitos humanos') || normalized.includes('mulheres') || normalized.includes('igualdade')) {
    return { icon: HeartHandshake, color: CATEGORY_COLORS.direito };
  }
  if (normalized.includes('licitac') || normalized.includes('contrato')) {
    return { icon: FileCheck2, color: CATEGORY_COLORS.direito };
  }
  if (normalized.includes('direito')) {
    return { icon: Scale, color: CATEGORY_COLORS.direito };
  }
  if (normalized.includes('financeira e orcamentaria') || normalized.includes('afo') || normalized.includes('orcamento') || normalized.includes('financas')) {
    return { icon: WalletCards, color: CATEGORY_COLORS.administracao };
  }
  if (normalized.includes('materiais') || normalized.includes('almoxarifado') || normalized.includes('patrimonio')) {
    return { icon: Boxes, color: CATEGORY_COLORS.administracao };
  }
  if (normalized.includes('recursos humanos')) {
    return { icon: UserRoundCog, color: CATEGORY_COLORS.administracao };
  }
  if (normalized.includes('gestao de pessoas') || normalized.includes('comportamento organizacional')) {
    return { icon: UsersRound, color: CATEGORY_COLORS.administracao };
  }
  if (normalized.includes('gestao de projetos') || normalized.includes('processos') || normalized.includes('governanca')) {
    return { icon: Workflow, color: CATEGORY_COLORS.administracao };
  }
  if (normalized.includes('gestao publica')) {
    return { icon: BriefcaseBusiness, color: CATEGORY_COLORS.administracao };
  }
  if (normalized.includes('administracao')) {
    return { icon: Building2, color: CATEGORY_COLORS.administracao };
  }
  if (normalized.includes('contabilidade publica')) {
    return { icon: ClipboardList, color: CATEGORY_COLORS.contabilidade };
  }
  if (normalized.includes('contabilidade') || normalized.includes('auditoria')) {
    return { icon: ChartNoAxesCombined, color: CATEGORY_COLORS.contabilidade };
  }
  if (normalized.includes('bancario')) {
    return { icon: Banknote, color: CATEGORY_COLORS.contabilidade };
  }
  if (normalized.includes('mercado financeiro')) {
    return { icon: CandlestickChart, color: CATEGORY_COLORS.economia };
  }
  if (normalized.includes('comercio exterior') || normalized.includes('aduaneira')) {
    return { icon: Ship, color: CATEGORY_COLORS.economia };
  }
  if (normalized.includes('economia') || normalized.includes('vendas') || normalized.includes('negociacao')) {
    return { icon: TrendingUp, color: CATEGORY_COLORS.economia };
  }
  if (normalized.includes('seguranca da informacao') || normalized.includes('cibernetica')) {
    return { icon: LockKeyhole, color: CATEGORY_COLORS.tecnologia };
  }
  if (normalized.includes('inteligencia artificial') || normalized.includes('machine learning')) {
    return { icon: BrainCircuit, color: CATEGORY_COLORS.tecnologia };
  }
  if (normalized.includes('analise de dados') || normalized.includes('banco de dados') || normalized.includes('dados') || normalized.includes('sql')) {
    return { icon: Database, color: CATEGORY_COLORS.tecnologia };
  }
  if (normalized.includes('tecnologia da informacao') || normalized.includes('redes') || normalized.includes('sistemas') || normalized.includes('programacao')) {
    return { icon: Cpu, color: CATEGORY_COLORS.tecnologia };
  }
  if (normalized.includes('informatica')) {
    return { icon: Monitor, color: CATEGORY_COLORS.tecnologia };
  }
  if (normalized.includes('atualidades')) {
    return { icon: Newspaper, color: CATEGORY_COLORS.gerais };
  }
  if (normalized.includes('geografia')) {
    return { icon: Map, color: CATEGORY_COLORS.gerais };
  }
  if (normalized.includes('historia')) {
    return { icon: ScrollText, color: CATEGORY_COLORS.gerais };
  }
  if (normalized.includes('conhecimentos gerais') || normalized.includes('distrito federal') || normalized.includes('realidade')) {
    return { icon: Globe2, color: CATEGORY_COLORS.gerais };
  }
  if (normalized.includes('etica') || normalized.includes('cidadania')) {
    return { icon: HandHeart, color: CATEGORY_COLORS.administracao };
  }
  if (normalized.includes('arquivologia') || normalized.includes('arquivo')) {
    return { icon: Archive, color: CATEGORY_COLORS.administracao };
  }
  if (normalized.includes('regimento')) {
    return { icon: ScrollText, color: CATEGORY_COLORS.direito };
  }
  if (normalized.includes('transito') || normalized.includes('ctb')) {
    return { icon: TrafficCone, color: CATEGORY_COLORS.direitoMarinho };
  }
  if (normalized.includes('primeiros socorros') || normalized.includes('urgencia') || normalized.includes('emergencia')) {
    return { icon: HeartPulse, color: CATEGORY_COLORS.saude };
  }
  if (normalized.includes('saude') || normalized.includes('sus') || normalized.includes('medicina') || normalized.includes('enfermagem') || normalized.includes('odontologia') || normalized.includes('farmacia') || normalized.includes('biologia')) {
    return { icon: Stethoscope, color: CATEGORY_COLORS.saude };
  }
  if (normalized.includes('medicina legal')) {
    return { icon: Microscope, color: CATEGORY_COLORS.saude };
  }
  if (normalized.includes('criminologia') || normalized.includes('criminalistica') || normalized.includes('pericia')) {
    return { icon: Fingerprint, color: CATEGORY_COLORS.direitoMarinho };
  }
  if (normalized.includes('seguranca publica') || normalized.includes('policial') || normalized.includes('defesa')) {
    return { icon: Shield, color: CATEGORY_COLORS.direitoMarinho };
  }
  if (normalized.includes('logistica') || normalized.includes('transporte')) {
    return { icon: Truck, color: CATEGORY_COLORS.administracao };
  }
  if (normalized.includes('meio ambiente') || normalized.includes('ambiental') || normalized.includes('ecologia')) {
    return { icon: Leaf, color: CATEGORY_COLORS.administracao };
  }
  if (normalized.includes('engenharia') || normalized.includes('obras')) {
    return { icon: HardHat, color: CATEGORY_COLORS.especificas };
  }
  if (normalized.includes('arquitetura') || normalized.includes('urbanismo')) {
    return { icon: Ruler, color: CATEGORY_COLORS.especificas };
  }
  if (normalized.includes('pedagogia') || normalized.includes('educacao') || normalized.includes('didatica') || normalized.includes('ensino')) {
    return { icon: GraduationCap, color: CATEGORY_COLORS.educacaoIdiomas };
  }

  // 3. Regras de fallback inteligente para matérias muito específicas:
  // - FileText para legislação, leis orgânicas, estatutos, decretos ou documentos
  if (
    normalized.includes('lei') ||
    normalized.includes('legislacao') ||
    normalized.includes('estatuto') ||
    normalized.includes('codigo') ||
    normalized.includes('decreto') ||
    normalized.includes('constituicao')
  ) {
    return { icon: FileText, color: CATEGORY_COLORS.direito };
  }

  // - ClipboardList para procedimentos, normas, resoluções e manuais
  if (
    normalized.includes('norma') ||
    normalized.includes('procedimento') ||
    normalized.includes('resolucao') ||
    normalized.includes('portaria') ||
    normalized.includes('manual') ||
    normalized.includes('instrucao')
  ) {
    return { icon: ClipboardList, color: CATEGORY_COLORS.especificas };
  }

  // - Layers3 para conteúdos específicos de um cargo
  if (
    normalized.includes('especific') ||
    normalized.includes('cargo') ||
    normalized.includes('tecnico') ||
    normalized.includes('analista')
  ) {
    return { icon: Layers3, color: CATEGORY_COLORS.especificas };
  }

  // - BookOpen para conteúdos teóricos gerais
  if (
    normalized.includes('teoria') ||
    normalized.includes('fundamento') ||
    normalized.includes('nocoes') ||
    normalized.includes('introducao') ||
    normalized.includes('conhecimento') ||
    normalized.length > 2
  ) {
    return { icon: BookOpen, color: CATEGORY_COLORS.especificas };
  }

  // - CircleHelp / Sparkles para matérias sem classificação clara
  return { icon: CircleHelp || Sparkles, color: CATEGORY_COLORS.especificas };
}

export interface SubjectIconProps {
  subjectName: string;
  className?: string;
}

/**
 * SubjectIcon
 * Renderiza o pequeno ícone colorido e minimalista da matéria preservando o espaço da linha.
 */
export const SubjectIcon: React.FC<SubjectIconProps> = ({ subjectName, className = '' }) => {
  const { icon: IconComponent, color } = resolveSubjectIcon(subjectName);

  return (
    <span
      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${className}`}
      style={{
        backgroundColor: `${color}15`,
        color: color,
      }}
      title={subjectName}
      aria-hidden="true"
    >
      <IconComponent className="w-3.5 h-3.5 stroke-[2]" />
    </span>
  );
};
