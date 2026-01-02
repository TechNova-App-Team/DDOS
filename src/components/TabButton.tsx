import { useTheme } from '../contexts/ThemeContext';
import { LucideIcon } from 'lucide-react';

interface TabButtonProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}

export const TabButton = ({ icon: Icon, label, active, onClick }: TabButtonProps) => {
  const { themeColor, accentColor } = useTheme();

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300
        ${active
          ? `backdrop-blur-xl border ${themeColor === 'black' ? 'bg-white/10 border-white/20' : 'bg-gray-800/50 border-gray-600/50'}`
          : 'hover:bg-white/5'
        }
      `}
      style={active ? { borderColor: accentColor + '40', backgroundColor: accentColor + '10' } : {}}
    >
      <Icon
        size={22}
        style={{ color: active ? accentColor : '#9ca3af' }}
      />
      <span
        className={`font-medium ${active ? '' : 'text-gray-400'}`}
        style={active ? { color: accentColor } : {}}
      >
        {label}
      </span>
    </button>
  );
};
