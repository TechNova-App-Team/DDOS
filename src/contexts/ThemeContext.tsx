import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface ThemeContextType {
  themeColor: string;
  accentColor: string;
  updateTheme: (color: string, accent: string) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getUserId = () => {
  let userId = localStorage.getItem('app_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('app_user_id', userId);
  }
  return userId;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeColor, setThemeColor] = useState('grey');
  const [accentColor, setAccentColor] = useState('#ffffff');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const userId = getUserId();
      
      // Try to load from localStorage first
      const savedTheme = localStorage.getItem('app_theme_color');
      const savedAccent = localStorage.getItem('app_accent_color');
      
      if (savedTheme && savedAccent) {
        setThemeColor(savedTheme);
        setAccentColor(savedAccent);
        setIsLoading(false);
        return;
      }

      // Try to load from Supabase with timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const { data } = await supabase
          .from('user_settings')
          .select('theme_color, accent_color')
          .eq('user_id', userId)
          .maybeSingle();

        clearTimeout(timeoutId);

        if (data) {
          setThemeColor(data.theme_color);
          setAccentColor(data.accent_color);
          localStorage.setItem('app_theme_color', data.theme_color);
          localStorage.setItem('app_accent_color', data.accent_color);
        }
      } catch (supabaseError) {
        console.warn('Supabase load failed, using defaults:', supabaseError);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTheme = async (color: string, accent: string) => {
    try {
      const userId = getUserId();
      const { error } = await supabase
        .from('user_settings')
        .update({
          theme_color: color,
          accent_color: accent,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      setThemeColor(color);
      setAccentColor(accent);
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeColor, accentColor, updateTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
