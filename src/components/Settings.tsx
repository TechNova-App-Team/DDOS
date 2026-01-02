import { useState } from 'react';
import { GlassCard } from './GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import { Palette, Check } from 'lucide-react';

export const Settings = () => {
  const { themeColor, accentColor, updateTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(themeColor);
  const [selectedAccent, setSelectedAccent] = useState(accentColor);
  const [isSaving, setIsSaving] = useState(false);

  const themeOptions = [
    { id: 'black', name: 'Pure Black', bg: '#000000' },
    { id: 'grey', name: 'Dark Grey', bg: '#1f2937' },
  ];

  const accentColors = [
    { name: 'White', color: '#ffffff' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Green', color: '#10b981' },
    { name: 'Purple', color: '#8b5cf6' },
    { name: 'Pink', color: '#ec4899' },
    { name: 'Orange', color: '#f97316' },
    { name: 'Yellow', color: '#eab308' },
    { name: 'Red', color: '#ef4444' },
    { name: 'Cyan', color: '#06b6d4' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await updateTheme(selectedTheme, selectedAccent);
    setTimeout(() => setIsSaving(false), 500);
  };

  const hasChanges = selectedTheme !== themeColor || selectedAccent !== accentColor;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Customize your application appearance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: accentColor + '20' }}
            >
              <Palette size={24} style={{ color: accentColor }} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Theme Color</h3>
              <p className="text-sm text-gray-400">Choose your base theme</p>
            </div>
          </div>

          <div className="space-y-3">
            {themeOptions.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-xl
                  transition-all duration-300 hover:scale-105
                  ${selectedTheme === theme.id
                    ? 'bg-white/10 border-2'
                    : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                  }
                `}
                style={selectedTheme === theme.id ? { borderColor: accentColor } : {}}
              >
                <div
                  className="w-12 h-12 rounded-lg border-2 border-white/20"
                  style={{ backgroundColor: theme.bg }}
                />
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">{theme.name}</p>
                  <p className="text-gray-400 text-sm">{theme.id === 'black' ? 'OLED friendly' : 'Softer contrast'}</p>
                </div>
                {selectedTheme === theme.id && (
                  <Check size={24} style={{ color: accentColor }} />
                )}
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">Accent Color</h3>
            <p className="text-sm text-gray-400">Pick your favorite accent color</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {accentColors.map((accent) => (
              <button
                key={accent.color}
                onClick={() => setSelectedAccent(accent.color)}
                className={`
                  aspect-square rounded-xl transition-all duration-300 hover:scale-110
                  border-2 relative
                  ${selectedAccent === accent.color
                    ? 'border-white scale-105'
                    : 'border-white/20'
                  }
                `}
                style={{ backgroundColor: accent.color }}
              >
                {selectedAccent === accent.color && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check size={24} className="text-white drop-shadow-lg" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-black/20 border border-white/10">
            <p className="text-sm text-gray-400 mb-2">Selected Color</p>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg"
                style={{ backgroundColor: selectedAccent }}
              />
              <span className="text-white font-mono">{selectedAccent.toUpperCase()}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Preview</h3>
            <p className="text-sm text-gray-400">
              {hasChanges ? 'You have unsaved changes' : 'No changes to save'}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`
              px-8 py-3 rounded-xl font-medium transition-all duration-300
              ${hasChanges && !isSaving
                ? 'hover:scale-105'
                : 'opacity-50 cursor-not-allowed'
              }
            `}
            style={{
              backgroundColor: hasChanges ? selectedAccent + '20' : '#374151',
              color: hasChanges ? selectedAccent : '#9ca3af',
              border: `2px solid ${hasChanges ? selectedAccent + '40' : 'transparent'}`
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">About</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Version</span>
            <span className="text-white font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Build</span>
            <span className="text-white font-medium">2026.01.01</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Platform</span>
            <span className="text-white font-medium">Windows</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
