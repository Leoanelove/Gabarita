import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export type NormalizedBannerSkin = 'verde' | 'azul' | 'roxo' | 'rosa' | 'laranja';

export const normalizeBannerThemeSkin = (
  themeContext: any,
  fallback: NormalizedBannerSkin = 'verde'
): NormalizedBannerSkin => {
  const activeKey =
    (typeof themeContext?.colorSkin === 'string' ? themeContext.colorSkin : '') ||
    (typeof themeContext?.palette?.id === 'string' ? themeContext.palette.id : '') ||
    (typeof themeContext?.palette?.name === 'string' ? themeContext.palette.name : '') ||
    (typeof themeContext?.activeTheme === 'string' ? themeContext.activeTheme : '') ||
    (typeof themeContext?.theme === 'string' ? themeContext.theme : '') ||
    (typeof themeContext?.colorSkin === 'object' && themeContext?.colorSkin?.id ? String(themeContext.colorSkin.id) : '') ||
    (typeof themeContext?.colorSkin === 'object' && themeContext?.colorSkin?.name ? String(themeContext.colorSkin.name) : '') ||
    fallback;

  const candidates: any[] = [
    activeKey,
    themeContext?.colorSkin,
    themeContext?.palette?.id,
    themeContext?.palette?.name,
    themeContext?.activeTheme,
  ];

  if (typeof document !== 'undefined') {
    try {
      const dataSkin = document.documentElement.getAttribute('data-skin') || document.body.getAttribute('data-skin');
      if (dataSkin) candidates.push(dataSkin);
      const classList = `${document.documentElement.className} ${document.body.className}`;
      candidates.push(classList);
    } catch {}
    try {
      const savedSkin = localStorage.getItem('gabarita_color_skin');
      if (savedSkin) candidates.push(savedSkin);
    } catch {}
  }

  for (const item of candidates) {
    if (!item) continue;
    const str = (typeof item === 'string' ? item : String(item?.id || item?.name || '')).trim().toLowerCase();
    if (!str) continue;

    if (str.includes('roxo') || str.includes('purple') || str.includes('violet')) {
      return 'roxo';
    }
    if (str.includes('laranja') || str.includes('orange') || str.includes('amber') || str.includes('dbz')) {
      return 'laranja';
    }
    if (str.includes('rosa') || str.includes('pink') || str.includes('rose')) {
      return 'rosa';
    }
    if (str.includes('azul') || str.includes('blue') || str.includes('sky') || str.includes('cyan')) {
      return 'azul';
    }
    if (str.includes('verde') || str.includes('green') || str.includes('emerald')) {
      return 'verde';
    }
  }

  return fallback;
};

export interface MenuBannerFrameProps {
  /** Dicionário com as URLs do Supabase para cada cor de tema do menu */
  bannerThemes: Record<string, string>;
  /** Conteúdo interno do banner (títulos, badges, botões, métricas) */
  children: React.ReactNode;
  /** Altura mínima opcional (ex: "min-h-[220px]") */
  minHeight?: string;
  /** Classes adicionais para o container externo do banner */
  className?: string;
  /** Classes adicionais para o container relativo de conteúdo (relative z-10) */
  contentClassName?: string;
  /** Classes customizadas para a tag <img> caso algum menu tenha escala/posição específica */
  imgClassName?: string;
  /** Classes customizadas para a camada absoluta de background */
  bgWrapperClassName?: string;
  /** Classes para camada de overlay opcional sobre a imagem */
  overlayClassName?: string;
  /** Texto alternativo da imagem de fundo */
  alt?: string;
  /** Tema de fallback caso não identificado */
  fallbackSkin?: NormalizedBannerSkin;
  /** Estilos inline opcionais para o container */
  style?: React.CSSProperties;
}

export const MenuBannerFrame: React.FC<MenuBannerFrameProps> = ({
  bannerThemes,
  children,
  minHeight = 'min-h-[190px] md:min-h-[220px]',
  className = '',
  contentClassName = 'w-full',
  imgClassName = 'w-full h-full object-cover object-center scale-[1.12] pointer-events-none select-none transition-transform duration-300',
  bgWrapperClassName = 'absolute -inset-2 overflow-hidden pointer-events-none select-none z-0',
  overlayClassName,
  alt = 'Banner',
  fallbackSkin = 'verde',
  style,
}) => {
  const themeContext = useTheme();
  const normalizedSkin = normalizeBannerThemeSkin(themeContext, fallbackSkin);
  const bannerUrl =
    bannerThemes[normalizedSkin] ||
    bannerThemes[fallbackSkin] ||
    bannerThemes.verde ||
    bannerThemes.azul ||
    Object.values(bannerThemes)[0] ||
    '';

  const bannerThemeGlowShadow = React.useMemo(() => {
    switch (normalizedSkin) {
      case 'roxo':
        return {
          boxShadow: '0 20px 40px -12px rgba(139, 92, 246, 0.45), 0 0 25px -5px rgba(167, 139, 250, 0.35)',
          borderColor: 'rgba(139, 92, 246, 0.4)',
        };
      case 'laranja':
        return {
          boxShadow: '0 20px 40px -12px rgba(249, 115, 22, 0.45), 0 0 25px -5px rgba(251, 146, 60, 0.35)',
          borderColor: 'rgba(249, 115, 22, 0.4)',
        };
      case 'azul':
        return {
          boxShadow: '0 20px 40px -12px rgba(59, 130, 246, 0.45), 0 0 25px -5px rgba(96, 165, 250, 0.35)',
          borderColor: 'rgba(59, 130, 246, 0.4)',
        };
      case 'rosa':
        return {
          boxShadow: '0 20px 40px -12px rgba(236, 72, 153, 0.45), 0 0 25px -5px rgba(244, 114, 182, 0.35)',
          borderColor: 'rgba(236, 72, 153, 0.4)',
        };
      case 'verde':
      default:
        return {
          boxShadow: '0 20px 40px -12px rgba(16, 185, 129, 0.45), 0 0 25px -5px rgba(52, 211, 153, 0.35)',
          borderColor: 'rgba(16, 185, 129, 0.4)',
        };
    }
  }, [normalizedSkin]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl md:rounded-3xl border bg-slate-900 dark:bg-slate-950 transition-all duration-300 ${minHeight} ${className}`.trim()}
      style={{
        boxShadow: bannerThemeGlowShadow.boxShadow,
        borderColor: bannerThemeGlowShadow.borderColor,
        ...style,
      }}
    >
      {/* Camada absoluta blindada do background */}
      <div className={bgWrapperClassName}>
        {bannerUrl && (
          <img
            key={bannerUrl}
            src={bannerUrl}
            alt={alt}
            className={imgClassName}
          />
        )}
      </div>

      {/* Overlay opcional de contraste */}
      {overlayClassName && <div className={overlayClassName} />}

      {/* Container relativo blindado de conteúdo */}
      <div className={`relative z-10 ${contentClassName}`.trim()}>
        {children}
      </div>
    </div>
  );
};

export default MenuBannerFrame;
