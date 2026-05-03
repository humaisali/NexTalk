import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateLanguage } from '../services/api';
import { Globe, Check, ChevronDown } from 'lucide-react';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'ur', label: 'Urdu',       flag: '🇵🇰' },
  { code: 'hi', label: 'Hindi',      flag: '🇮🇳' },
  { code: 'ar', label: 'Arabic',     flag: '🇸🇦' },
  { code: 'fr', label: 'French',     flag: '🇫🇷' },
  { code: 'es', label: 'Spanish',    flag: '🇪🇸' },
  { code: 'de', label: 'German',     flag: '🇩🇪' },
  { code: 'zh', label: 'Chinese',    flag: '🇨🇳' },
  { code: 'ja', label: 'Japanese',   flag: '🇯🇵' },
  { code: 'ko', label: 'Korean',     flag: '🇰🇷' },
  { code: 'pt', label: 'Portuguese', flag: '🇧🇷' },
  { code: 'ru', label: 'Russian',    flag: '🇷🇺' },
  { code: 'tr', label: 'Turkish',    flag: '🇹🇷' },
  { code: 'it', label: 'Italian',    flag: '🇮🇹' },
];

const LanguageSelector = ({ onLanguageChange }) => {
  const { user, setUser } = useAuth();
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === (user?.language || 'en')) || SUPPORTED_LANGUAGES[0];

  const handleSelect = async (lang) => {
    if (lang.code === user?.language) { setOpen(false); return; }
    setSaving(true);
    try {
      const { data } = await updateLanguage(lang.code);
      setUser(data.user);
      onLanguageChange?.(lang.code);
    } catch (err) {
      console.error('Language update failed:', err);
    } finally { setSaving(false); setOpen(false); }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={saving}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-nt border transition-all text-left"
        style={{
          background: open ? 'rgba(255,239,178,0.08)' : 'transparent',
          borderColor: open ? 'rgba(255,239,178,0.25)' : '#025A50',
          color: '#D4C98A'
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.borderColor = 'rgba(255,239,178,0.2)'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.borderColor = '#025A50'; }}>
        <Globe size={13} style={{ color: open ? '#FFEFB2' : '#7A9E99' }} />
        <span className="text-sm flex-shrink-0">{current.flag}</span>
        <span className="text-xs flex-1">{current.label}</span>
        {user?.language && user.language !== 'en' && (
          <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                style={{ background: 'rgba(96,212,200,0.15)', color: '#60D4C8', border: '1px solid rgba(96,212,200,0.2)' }}>
            Auto
          </span>
        )}
        <ChevronDown size={12} style={{ color: '#7A9E99', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 w-52 rounded-nt-lg border shadow-nt-float z-40 overflow-hidden"
               style={{ background: '#013E37', borderColor: '#025A50' }}>
            <div className="px-3 py-2.5 border-b" style={{ borderColor: '#025A50' }}>
              <p className="text-xs font-semibold" style={{ color: '#FFEFB2' }}>Translation Language</p>
              <p className="text-xs mt-0.5" style={{ color: '#7A9E99' }}>Messages auto-translate on receive</p>
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === (user?.language || 'en');
                return (
                  <button key={lang.code} onClick={() => handleSelect(lang)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left transition-all"
                    style={{ background: isSelected ? 'rgba(255,239,178,0.08)' : 'transparent' }}
                    onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = 'rgba(255,239,178,0.05)')}
                    onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}>
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span className="text-sm flex-1" style={{ color: isSelected ? '#FFEFB2' : '#D4C98A' }}>{lang.label}</span>
                    {isSelected && <Check size={12} style={{ color: '#FFEFB2' }} />}
                    {lang.code === 'en' && !isSelected && (
                      <span className="text-xs" style={{ color: 'rgba(122,158,153,0.5)' }}>default</span>
                    )}
                  </button>
                );
              })}
            </div>
            {user?.language && user.language !== 'en' && (
              <div className="px-3 py-2 border-t" style={{ borderColor: '#025A50', background: 'rgba(96,212,200,0.05)' }}>
                <p className="text-xs" style={{ color: '#60D4C8' }}>
                  Auto-translating to <strong>{current.label}</strong>
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
