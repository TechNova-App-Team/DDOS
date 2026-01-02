import { ReactNode } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard = ({ children, className = '', hover = false }: GlassCardProps) => {
  const { themeColor } = useTheme();

  const baseClasses = `
    backdrop-blur-xl rounded-2xl border
    ${themeColor === 'black' ? 'bg-black/30 border-white/10' : 'bg-gray-900/30 border-gray-700/30'}
    ${hover ? 'transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105' : ''}
  `;

  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
};
