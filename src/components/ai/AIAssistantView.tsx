import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, Send, Bot, User, Loader2 } from 'lucide-react';
import { AIService } from '../../services/aiService';
import { Card, CardBody } from '../../design-system/Card';
import { Button } from '../../design-system/Button';
import { MenuBannerFrame } from '../common/MenuBannerFrame';
import { useTheme } from '../../contexts/ThemeContext';

export const ASSISTENTE_IA_BANNER_THEMES: Record<string, string> = {
  verde: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Assistente%20IA/Banner-Assistente-verde.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBBc3Npc3RlbnRlIElBL0Jhbm5lci1Bc3Npc3RlbnRlLXZlcmRlLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI5NzE2OTcsImV4cCI6NDk0NjU3MTY5N30.ttyglhw4yJRd8HQekm2xioI9wUTMmsVbExSYuimHBP4Jq3nhT_Bz8oSO-C8B-VwX9sA3HBKq824njk4kbkteBQ",
  azul: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Assistente%20IA/Banner-Assistente-azul.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBBc3Npc3RlbnRlIElBL0Jhbm5lci1Bc3Npc3RlbnRlLWF6dWwucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5Mjk3MTcxMCwiZXhwIjo0OTQ2NTcxNzEwfQ.Zc0CcMi_Mq_CF94Zh2hIhQW3P0lm3g50jODMQJgOejjT09jZn2DTa_QQdfomOXJnL74bNdA1nw7JQ3Equ3U1kg",
  rosa: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Assistente%20IA/Banner-Assistente-Rosa.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBBc3Npc3RlbnRlIElBL0Jhbm5lci1Bc3Npc3RlbnRlLVJvc2EucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5Mjk3MTcxOSwiZXhwIjo0OTQ2NTcxNzE5fQ.lIkrPBdKUxA_-dHrm42Pd2-N1t-Su-cwgapfZjFkRqeCIdkeD0DJJhwRBome87mcqsxyGb2hp6tf7cuY48xR1A",
  roxo: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Assistente%20IA/Banner-Assistente-Roxo.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBBc3Npc3RlbnRlIElBL0Jhbm5lci1Bc3Npc3RlbnRlLVJveG8ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5Mjk3MTcyOSwiZXhwIjo0OTQ2NTcxNzI5fQ.koNmpPw3iMFhITuBZvZ4TgfYPtuNgRuCgKMGVp8TRUfYSLzU1KRWw_EPD2usToXE-Y_wcP9EfFPtHB-QBh9phg",
  laranja: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Assistente%20IA/Banner-Assistente-Laranja.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBBc3Npc3RlbnRlIElBL0Jhbm5lci1Bc3Npc3RlbnRlLUxhcmFuamEucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5Mjk3MTc0MiwiZXhwIjo0OTQ2NTcxNzQyfQ.5i7zPq-9wX-6X8jNahv0P9gJLHBpNGgRtPWQCU9ETq-7sVn9uvKmC0f6w8ohd-euqu5x5mTJ9zeYr4Z0uP9jlA"
};

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistantView: React.FC = () => {
  const { colorSkin, palette } = useTheme();
  const currentTheme = (
    colorSkin === 'purple' ? 'roxo' :
    colorSkin === 'orange' || colorSkin === 'dbz' ? 'laranja' :
    colorSkin || palette?.id || 'azul'
  ).toLowerCase();

  const themeKey = (currentTheme || 'azul').toLowerCase();
  const bannerUrl = ASSISTENTE_IA_BANNER_THEMES[themeKey] || ASSISTENTE_IA_BANNER_THEMES.azul;

  const themeGlowStyles = useMemo(() => {
    switch (themeKey) {
      case 'roxo':
        return {
          color: '#A78BFA',
          borderColor: 'rgba(167, 139, 250, 0.45)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(167, 139, 250, 0.95), 0 0 18px rgba(139, 92, 246, 0.85), 0 0 32px rgba(124, 58, 237, 0.65)',
        };
      case 'laranja':
        return {
          color: '#FB923C',
          borderColor: 'rgba(251, 146, 60, 0.45)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(251, 146, 60, 0.95), 0 0 18px rgba(249, 115, 22, 0.85), 0 0 32px rgba(234, 88, 12, 0.65)',
        };
      case 'azul':
        return {
          color: '#60A5FA',
          borderColor: 'rgba(96, 165, 250, 0.45)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(96, 165, 250, 0.95), 0 0 18px rgba(37, 99, 235, 0.8), 0 0 32px rgba(29, 78, 216, 0.6)',
        };
      case 'rosa':
        return {
          color: '#F472B6',
          borderColor: 'rgba(244, 114, 182, 0.45)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(244, 114, 182, 0.95), 0 0 18px rgba(219, 39, 119, 0.8), 0 0 32px rgba(190, 24, 93, 0.6)',
        };
      case 'verde':
      default:
        return {
          color: '#34D399',
          borderColor: 'rgba(52, 211, 153, 0.45)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(52, 211, 153, 0.95), 0 0 18px rgba(16, 185, 129, 0.8), 0 0 32px rgba(5, 150, 105, 0.6)',
        };
    }
  }, [themeKey]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_init',
      sender: 'assistant',
      text: '### 🤖 Olá! Sou o seu Assistente de Estudos Inteligente (Gemini)\n\nEstou conectado aos seus dados reais de estudo. Como posso te orientar hoje?',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'O que estudar hoje?',
    'Quais são minhas matérias atrasadas?',
    'Quais assuntos têm mais erros?',
    'Como está minha evolução semanal?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsLoading(true);

    try {
      const response = await AIService.queryAssistant(textToSend);
      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: 'Desculpe, ocorreu um erro ao processar sua pergunta.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-h-[calc(100vh-110px)] flex flex-col pb-10">
      <MenuBannerFrame
        bannerThemes={ASSISTENTE_IA_BANNER_THEMES}
        minHeight="min-h-[180px] md:min-h-[210px]"
        className="assistente-ia-banner w-full border border-slate-200/20 dark:border-slate-800 shadow-xl flex items-center bg-slate-950 p-6 md:p-8 shrink-0 card-banner metas-xp-banner"
        contentClassName="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        imgClassName="w-full h-full object-cover object-center scale-[1.14] pointer-events-none select-none transition-transform duration-300"
        alt="Banner Assistente Inteligente (Gemini)"
        fallbackSkin="azul"
      >
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <div
                className="w-11 h-11 rounded-xl bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-md"
                style={{ color: themeGlowStyles.color }}
              >
                <Sparkles className="w-6 h-6 fill-current" />
              </div>
              <h2
                className="provas-banner-title text-xl sm:text-2xl md:text-3xl font-extrabold !text-white tracking-tight leading-tight select-none drop-shadow-md"
                style={{
                  color: '#FFFFFF',
                  textShadow: themeGlowStyles.textShadow,
                }}
              >
                Assistente Inteligente (Gemini)
              </h2>
            </div>
            <p
              className="text-xs sm:text-sm !text-white/90 leading-relaxed max-w-xl drop-shadow-xs"
              style={{ color: 'rgba(255, 255, 255, 0.92)' }}
            >
              Diagnóstico baseado em seus dados reais de estudo.
            </p>
          </div>
      </MenuBannerFrame>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 shrink-0">
        <span className="text-xs sm:text-sm font-bold text-slate-400 whitespace-nowrap">Sugestões:</span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-2 border-indigo-100 dark:border-indigo-950 shadow-lg min-h-[580px] sm:min-h-[650px] lg:min-h-[720px] rounded-2xl">
        <CardBody className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 space-y-6 min-h-[460px] sm:min-h-[530px] lg:min-h-[600px]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-gradient-to-br from-indigo-500 to-teal-500 text-white'}`}>
                {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`max-w-[92%] sm:max-w-[88%] rounded-2xl p-5 sm:p-6 space-y-2 shadow-xs ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-slate-100'}`}>
                <div className="flex items-center justify-between gap-4 text-xs opacity-80">
                  <span className="font-bold">{msg.sender === 'user' ? 'Você' : 'Assistente IA'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex items-center gap-3 text-sm">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Analisando dados reais...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardBody>

        <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3 sm:gap-4">
            <input
              type="text"
              placeholder="Digite sua pergunta sobre seus estudos, matérias, revisões ou desempenho..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm sm:text-base px-5 py-3.5 sm:py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={!inputQuery.trim()}
              rightIcon={<Send className="w-4 h-4 sm:w-5 sm:h-5" />}
              className="px-6 py-3.5 sm:py-4 h-auto text-sm sm:text-base font-bold rounded-xl shrink-0"
            >
              Enviar
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
