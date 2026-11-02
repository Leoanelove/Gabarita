import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Quote,
  RemoveFormatting,
  ChevronDown,
  Check,
  Eraser,
} from 'lucide-react';

// Paleta de cores idêntica ao Gmail (8 colunas)
const GMAIL_GRAYSCALE_ROW = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#ffffff',
];

const GMAIL_VIBRANT_ROW = [
  '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff', '#ff00ff',
];

const GMAIL_SHADES_GRID = [
  ['#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc'],
  ['#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd'],
  ['#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0'],
  ['#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79'],
  ['#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#0b5394', '#351c75', '#741b47'],
  ['#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#073763', '#20124d', '#4c1130'],
];

const FONT_FAMILIES = [
  { label: 'Sans Serif', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Monospace', value: '"Courier New", Courier, monospace' },
];

const FONT_SIZES = [
  { label: 'Pequeno', commandValue: '2', previewClass: 'text-xs' },
  { label: 'Normal', commandValue: '3', previewClass: 'text-sm' },
  { label: 'Grande', commandValue: '5', previewClass: 'text-lg font-medium' },
  { label: 'Enorme', commandValue: '6', previewClass: 'text-2xl font-semibold' },
];

// Sanitiza HTML preservando apenas tags e estilos seguros de formatação de texto rico
export const sanitizeFlashcardHtml = (rawHtml: string): string => {
  if (!rawHtml) return '';
  return rawHtml
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .trim();
};

// Extrai o texto puro de um conteúdo HTML ou texto simples (para validação, busca e exportação)
export const stripHtmlToPlainText = (content: string): string => {
  if (!content) return '';
  if (!/<[a-z][\s\S]*>/i.test(content)) {
    return content;
  }
  return content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// Verifica se uma string contém tags HTML de formatação
export const hasRichHtmlTags = (content: string): boolean => {
  if (!content) return false;
  return /<(b|strong|i|em|u|s|strike|span|font|div|p|br|ul|ol|li|blockquote|sub|sup)\b[^>]*>/i.test(content);
};

// Converte texto puro legado (com \n) para HTML seguro ao abrir no editor
const normalizeInitialEditorHtml = (value: string): string => {
  if (!value) return '';
  if (hasRichHtmlTags(value)) {
    return sanitizeFlashcardHtml(value);
  }
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '<br>');
};

// Componente reutilizável para renderizar o conteúdo do Flashcard (HTML rico ou texto simples legado)
export const FlashcardRichContent: React.FC<{
  content: string;
  className?: string;
}> = ({ content, className = '' }) => {
  if (!content) return null;

  if (!hasRichHtmlTags(content)) {
    return (
      <div className={`whitespace-pre-line break-words ${className}`}>
        {content}
      </div>
    );
  }

  const safeHtml = sanitizeFlashcardHtml(content);

  return (
    <div
      className={`flashcard-rich-content break-words [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/60 [&_blockquote]:pl-3.5 [&_blockquote]:py-1 [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:bg-slate-100/70 dark:[&_blockquote]:bg-slate-800/60 [&_blockquote]:rounded-r-lg [&_font[size='2']]:text-xs [&_font[size='3']]:text-sm [&_font[size='5']]:text-lg [&_font[size='6']]:text-2xl ${className}`}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
};

export interface GmailRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minRows?: number;
  hasError?: boolean;
}

export const GmailRichTextEditor: React.FC<GmailRichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '',
  minRows = 3,
  hasError = false,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const isInternalChangeRef = useRef<boolean>(false);

  const [isToolbarVisible, setIsToolbarVisible] = useState<boolean>(true);
  const [openDropdown, setOpenDropdown] = useState<'font' | 'size' | 'color' | 'align' | null>(null);

  // Estado visual dos comandos ativos
  const [selectedFontLabel, setSelectedFontLabel] = useState<string>('Sans Serif');
  const [selectedSizeLabel, setSelectedSizeLabel] = useState<string>('Normal');
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    orderedList: false,
    unorderedList: false,
    blockquote: false,
    align: 'left' as 'left' | 'center' | 'right',
  });
  const [activeTextColor, setActiveTextColor] = useState<string>('#000000');
  const [activeBgColor, setActiveBgColor] = useState<string>('');
  const [isEmpty, setIsEmpty] = useState<boolean>(() => !stripHtmlToPlainText(value).trim());

  // Sincronizar valor externo (ex: ao abrir modal ou limpar formulário)
  useEffect(() => {
    if (!editorRef.current) return;
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }
    const normalized = normalizeInitialEditorHtml(value);
    if (editorRef.current.innerHTML !== normalized) {
      editorRef.current.innerHTML = normalized;
    }
    setIsEmpty(!stripHtmlToPlainText(value).trim());
  }, [value]);

  // Fechar popovers ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Salvar a seleção atual do cursor dentro do editor
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  }, []);

  // Restaurar a seleção antes de aplicar comando da barra
  const restoreSelection = useCallback(() => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }, []);

  // Atualizar estado dos botões ativos conforme a posição do cursor
  const updateToolbarActiveStates = useCallback(() => {
    if (!editorRef.current) return;
    try {
      const bold = document.queryCommandState('bold');
      const italic = document.queryCommandState('italic');
      const underline = document.queryCommandState('underline');
      const orderedList = document.queryCommandState('insertOrderedList');
      const unorderedList = document.queryCommandState('insertUnorderedList');
      const justifyCenter = document.queryCommandState('justifyCenter');
      const justifyRight = document.queryCommandState('justifyRight');
      const formatBlock = (document.queryCommandValue('formatBlock') || '').toLowerCase();
      const fontName = (document.queryCommandValue('fontName') || '').toLowerCase();
      const fontSize = String(document.queryCommandValue('fontSize') || '3');

      if (fontName.includes('georgia') || fontName.includes('times') || (fontName.includes('serif') && !fontName.includes('sans'))) {
        setSelectedFontLabel('Serif');
      } else if (fontName.includes('courier') || fontName.includes('mono')) {
        setSelectedFontLabel('Monospace');
      } else {
        setSelectedFontLabel('Sans Serif');
      }

      const matchedSize = FONT_SIZES.find(s => s.commandValue === fontSize);
      if (matchedSize) {
        setSelectedSizeLabel(matchedSize.label);
      }

      setActiveStates({
        bold,
        italic,
        underline,
        orderedList,
        unorderedList,
        blockquote: formatBlock.includes('blockquote'),
        align: justifyCenter ? 'center' : justifyRight ? 'right' : 'left',
      });
    } catch {
      // Ignorar erros de queryCommandState em navegadores específicos
    }
  }, []);

  // Emitir mudança de conteúdo
  const emitEditorChange = useCallback(() => {
    if (!editorRef.current) return;
    const rawHtml = editorRef.current.innerHTML;
    const plain = stripHtmlToPlainText(rawHtml);
    const empty = !plain.trim();
    setIsEmpty(empty);
    isInternalChangeRef.current = true;
    onChange(empty ? '' : sanitizeFlashcardHtml(rawHtml));
    updateToolbarActiveStates();
  }, [onChange, updateToolbarActiveStates]);

  // Executar comando de formatação no editor
  const executeCommand = (command: string, commandValue: string = '') => {
    restoreSelection();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, commandValue);
    saveSelection();
    emitEditorChange();
  };

  // Alternar bloco de citação (blockquote)
  const handleToggleBlockquote = () => {
    restoreSelection();
    const currentBlock = (document.queryCommandValue('formatBlock') || '').toLowerCase();
    if (currentBlock.includes('blockquote')) {
      document.execCommand('formatBlock', false, 'div');
    } else {
      document.execCommand('formatBlock', false, 'blockquote');
    }
    saveSelection();
    emitEditorChange();
  };

  // Aplicar cor de fundo (marca-texto)
  const handleSelectBgColor = (color: string) => {
    restoreSelection();
    document.execCommand('styleWithCSS', false, 'true');
    if (!color) {
      document.execCommand('hiliteColor', false, 'transparent');
      setActiveBgColor('');
    } else {
      document.execCommand('hiliteColor', false, color);
      setActiveBgColor(color);
    }
    saveSelection();
    emitEditorChange();
    setOpenDropdown(null);
  };

  // Aplicar cor do texto
  const handleSelectTextColor = (color: string) => {
    restoreSelection();
    document.execCommand('styleWithCSS', false, 'true');
    if (!color) {
      document.execCommand('removeFormat', false, '');
      setActiveTextColor('#000000');
    } else {
      document.execCommand('foreColor', false, color);
      setActiveTextColor(color);
    }
    saveSelection();
    emitEditorChange();
    setOpenDropdown(null);
  };

  // Atalhos de teclado Ctrl+B, Ctrl+I, Ctrl+U
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        executeCommand('bold');
      } else if (key === 'i') {
        e.preventDefault();
        executeCommand('italic');
      } else if (key === 'u') {
        e.preventDefault();
        executeCommand('underline');
      }
    }
  };

  const minHeightPx = Math.max(84, minRows * 28);

  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-slate-800/90 transition-all shadow-2xs ${
        hasError
          ? 'border-rose-500 ring-2 ring-rose-500/15'
          : 'border-slate-300 dark:border-slate-700 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
      }`}
    >
      {/* BARRA DE FERRAMENTAS ESTILO GMAIL */}
      <div
        ref={toolbarRef}
        className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200/80 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-900/70 rounded-t-2xl flex-wrap relative"
      >
        {/* Botão Toggle "Aa" (Exibir/Ocultar barra de formatação) */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsToolbarVisible(prev => !prev);
            setOpenDropdown(null);
          }}
          title={isToolbarVisible ? 'Ocultar opções de formatação' : 'Mostrar opções de formatação'}
          className={`h-7 px-2 rounded-lg text-xs font-extrabold tracking-tight flex items-center justify-center transition-colors cursor-pointer select-none ${
            isToolbarVisible
              ? 'bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
          }`}
        >
          Aa
        </button>

        {isToolbarVisible && (
          <>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

            {/* 1. Fonte (Sans Serif, Serif, Monospace) */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                  setOpenDropdown(prev => (prev === 'font' ? null : 'font'));
                }}
                title="Fonte"
                className="h-7 px-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer select-none min-w-[82px] justify-between"
              >
                <span className="truncate">{selectedFontLabel}</span>
                <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
              </button>

              {openDropdown === 'font' && (
                <div className="absolute left-0 top-full mt-1 z-50 w-40 py-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
                  {FONT_FAMILIES.map(font => (
                    <button
                      key={font.label}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedFontLabel(font.label);
                        executeCommand('fontName', font.value);
                        setOpenDropdown(null);
                      }}
                      style={{ fontFamily: font.value }}
                      className="w-full px-3 py-1.5 text-left text-xs text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                    >
                      <span>{font.label}</span>
                      {selectedFontLabel === font.label && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

            {/* 2. Tamanho do Texto (TT) */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                  setOpenDropdown(prev => (prev === 'size' ? null : 'size'));
                }}
                title="Tamanho do texto"
                className="h-7 px-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer select-none"
              >
                <span className="inline-flex items-baseline leading-none font-serif tracking-tighter">
                  <span className="text-[10px] font-bold">T</span>
                  <span className="text-sm font-extrabold">T</span>
                </span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {openDropdown === 'size' && (
                <div className="absolute left-0 top-full mt-1 z-50 w-36 py-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
                  {FONT_SIZES.map(size => (
                    <button
                      key={size.label}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedSizeLabel(size.label);
                        executeCommand('fontSize', size.commandValue);
                        setOpenDropdown(null);
                      }}
                      className="w-full px-3 py-1.5 text-left text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                    >
                      <span className={size.previewClass}>{size.label}</span>
                      {selectedSizeLabel === size.label && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

            {/* 3. Estilos Básicos: Negrito (B), Itálico (I), Sublinhado (U) */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('bold');
              }}
              title="Negrito (Ctrl+B)"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                activeStates.bold
                  ? 'bg-primary/15 text-primary dark:bg-primary/25'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('italic');
              }}
              title="Itálico (Ctrl+I)"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                activeStates.italic
                  ? 'bg-primary/15 text-primary dark:bg-primary/25'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Italic className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('underline');
              }}
              title="Sublinhado (Ctrl+U)"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                activeStates.underline
                  ? 'bg-primary/15 text-primary dark:bg-primary/25'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Underline className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            {/* 4. Seletor Duplo de Cores ("A" sublinhado com seta - Estilo Gmail) */}
            <div className="static">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                  setOpenDropdown(prev => (prev === 'color' ? null : 'color'));
                }}
                title="Cor do texto e grifo (marca-texto)"
                className={`h-7 px-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer select-none ${
                  openDropdown === 'color'
                    ? 'bg-blue-100/80 dark:bg-slate-700 text-slate-900 dark:text-white'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex flex-col items-center justify-center leading-none">
                  <span
                    className="text-xs font-black px-1 rounded-xs"
                    style={{
                      color: activeTextColor && activeTextColor !== '#000000' ? activeTextColor : undefined,
                      backgroundColor: activeBgColor || undefined,
                    }}
                  >
                    A
                  </span>
                  <span
                    className="w-3.5 h-0.5 mt-0.5 rounded-full"
                    style={{
                      backgroundColor: activeBgColor || activeTextColor || '#1e293b',
                    }}
                  />
                </span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {/* POPOVER DUPLO LADO A LADO IDÊNTICO AO GMAIL (Centralizado na barra para visibilidade total) */}
              {openDropdown === 'color' && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 p-3.5 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 w-[calc(100%-12px)] max-w-[385px]">
                  {/* Coluna Esquerda: Cor do plano de fundo (Marca-texto) */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                        Cor do plano de fundo
                      </span>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectBgColor('');
                        }}
                        title="Remover cor de fundo"
                        className="text-[10px] font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Eraser className="w-3 h-3" /> Limpar
                      </button>
                    </div>

                    {/* Linha 1: Tons de Cinza */}
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      {GMAIL_GRAYSCALE_ROW.map(color => (
                        <button
                          key={`bg-gray-${color}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectBgColor(color);
                          }}
                          style={{ backgroundColor: color }}
                          className="w-4 h-4 rounded-xs border border-slate-300 dark:border-slate-600 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer"
                          title={color}
                        >
                          {activeBgColor.toLowerCase() === color && (
                            <Check className={`w-3 h-3 ${color === '#ffffff' || color === '#d9d9d9' ? 'text-slate-900' : 'text-white'}`} />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Linha 2: Cores Vibrantes */}
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      {GMAIL_VIBRANT_ROW.map(color => (
                        <button
                          key={`bg-vib-${color}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectBgColor(color);
                          }}
                          style={{ backgroundColor: color }}
                          className="w-4 h-4 rounded-xs border border-black/10 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer"
                          title={color}
                        >
                          {activeBgColor.toLowerCase() === color && (
                            <Check className={`w-3 h-3 ${color === '#ffff00' || color === '#00ff00' || color === '#00ffff' ? 'text-slate-900' : 'text-white'}`} />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Grade 6x8: Tons Pastéis a Escuros */}
                    <div className="space-y-1">
                      {GMAIL_SHADES_GRID.map((row, rIdx) => (
                        <div key={`bg-row-${rIdx}`} className="grid grid-cols-8 gap-1">
                          {row.map(color => (
                            <button
                              key={`bg-shade-${color}`}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectBgColor(color);
                              }}
                              style={{ backgroundColor: color }}
                              className="w-4 h-4 rounded-xs border border-black/10 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer"
                              title={color}
                            >
                              {activeBgColor.toLowerCase() === color && (
                                <Check className={`w-3 h-3 ${rIdx < 3 ? 'text-slate-900' : 'text-white'}`} />
                              )}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coluna Direita: Cor do texto */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Cor do texto
                      </span>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectTextColor('');
                        }}
                        title="Restaurar cor padrão do texto"
                        className="text-[10px] font-semibold text-slate-500 hover:text-primary dark:text-slate-400 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Eraser className="w-3 h-3" /> Padrão
                      </button>
                    </div>

                    {/* Linha 1: Tons de Cinza */}
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      {GMAIL_GRAYSCALE_ROW.map(color => (
                        <button
                          key={`fg-gray-${color}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectTextColor(color);
                          }}
                          style={{ backgroundColor: color }}
                          className="w-4 h-4 rounded-xs border border-slate-300 dark:border-slate-600 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer"
                          title={color}
                        >
                          {activeTextColor.toLowerCase() === color && (
                            <Check className={`w-3 h-3 ${color === '#ffffff' || color === '#d9d9d9' ? 'text-slate-900' : 'text-white'}`} />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Linha 2: Cores Vibrantes */}
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      {GMAIL_VIBRANT_ROW.map(color => (
                        <button
                          key={`fg-vib-${color}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectTextColor(color);
                          }}
                          style={{ backgroundColor: color }}
                          className="w-4 h-4 rounded-xs border border-black/10 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer"
                          title={color}
                        >
                          {activeTextColor.toLowerCase() === color && (
                            <Check className={`w-3 h-3 ${color === '#ffff00' || color === '#00ff00' || color === '#00ffff' ? 'text-slate-900' : 'text-white'}`} />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Grade 6x8: Tons Pastéis a Escuros */}
                    <div className="space-y-1">
                      {GMAIL_SHADES_GRID.map((row, rIdx) => (
                        <div key={`fg-row-${rIdx}`} className="grid grid-cols-8 gap-1">
                          {row.map(color => (
                            <button
                              key={`fg-shade-${color}`}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectTextColor(color);
                              }}
                              style={{ backgroundColor: color }}
                              className="w-4 h-4 rounded-xs border border-black/10 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer"
                              title={color}
                            >
                              {activeTextColor.toLowerCase() === color && (
                                <Check className={`w-3 h-3 ${rIdx < 3 ? 'text-slate-900' : 'text-white'}`} />
                              )}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

            {/* 5. Alinhamento (Esquerda, Centro, Direita) */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                  setOpenDropdown(prev => (prev === 'align' ? null : 'align'));
                }}
                title="Alinhamento"
                className="h-7 px-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center gap-0.5 cursor-pointer"
              >
                {activeStates.align === 'center' ? (
                  <AlignCenter className="w-3.5 h-3.5" />
                ) : activeStates.align === 'right' ? (
                  <AlignRight className="w-3.5 h-3.5" />
                ) : (
                  <AlignLeft className="w-3.5 h-3.5" />
                )}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {openDropdown === 'align' && (
                <div className="absolute left-0 top-full mt-1 z-50 py-1 px-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeCommand('justifyLeft');
                      setOpenDropdown(null);
                    }}
                    title="Alinhar à esquerda"
                    className={`p-1.5 rounded-lg cursor-pointer ${
                      activeStates.align === 'left'
                        ? 'bg-primary/15 text-primary'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeCommand('justifyCenter');
                      setOpenDropdown(null);
                    }}
                    title="Centralizar"
                    className={`p-1.5 rounded-lg cursor-pointer ${
                      activeStates.align === 'center'
                        ? 'bg-primary/15 text-primary'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeCommand('justifyRight');
                      setOpenDropdown(null);
                    }}
                    title="Alinhar à direita"
                    className={`p-1.5 rounded-lg cursor-pointer ${
                      activeStates.align === 'right'
                        ? 'bg-primary/15 text-primary'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* 6. Listas e Recuo (Lista numerada, Lista com marcadores, Diminuir recuo, Aumentar recuo) */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('insertOrderedList');
              }}
              title="Lista numerada"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                activeStates.orderedList
                  ? 'bg-primary/15 text-primary dark:bg-primary/25'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('insertUnorderedList');
              }}
              title="Lista com marcadores"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                activeStates.unorderedList
                  ? 'bg-primary/15 text-primary dark:bg-primary/25'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('outdent');
              }}
              title="Diminuir recuo"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Outdent className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('indent');
              }}
              title="Aumentar recuo"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Indent className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

            {/* 7. Citação ("") e Limpar Formatação (Tx) */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleToggleBlockquote();
              }}
              title="Citação (Destacar artigo de lei / súmula)"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                activeStates.blockquote
                  ? 'bg-primary/15 text-primary dark:bg-primary/25'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('removeFormat');
                executeCommand('hiliteColor', 'transparent');
                setActiveBgColor('');
                setActiveTextColor('#000000');
              }}
              title="Limpar formatação (Tx)"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RemoveFormatting className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* ÁREA EDITÁVEL (CONTENTEDITABLE) */}
      <div className="relative">
        {isEmpty && placeholder && (
          <div
            onClick={() => editorRef.current?.focus()}
            className="absolute inset-x-3.5 top-2.5 text-sm text-slate-400 dark:text-slate-500 pointer-events-none select-none leading-relaxed"
          >
            {placeholder}
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitEditorChange}
          onKeyUp={() => {
            saveSelection();
            updateToolbarActiveStates();
          }}
          onMouseUp={() => {
            saveSelection();
            updateToolbarActiveStates();
          }}
          onBlur={saveSelection}
          onKeyDown={handleKeyDown}
          style={{ minHeight: `${minHeightPx}px` }}
          className="w-full px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none overflow-y-auto max-h-56 leading-relaxed break-words [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/60 [&_blockquote]:pl-3.5 [&_blockquote]:py-1 [&_blockquote]:my-1.5 [&_blockquote]:italic [&_blockquote]:bg-slate-100/70 dark:[&_blockquote]:bg-slate-800/60 [&_blockquote]:rounded-r-lg [&_font[size='2']]:text-xs [&_font[size='3']]:text-sm [&_font[size='5']]:text-lg [&_font[size='6']]:text-2xl"
        />
      </div>
    </div>
  );
};
