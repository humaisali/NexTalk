import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateLanguage } from '../services/api';
import { FiGlobe, FiCheck, FiChevronDown } from 'react-icons/fi';

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

/**
 * LanguageSelector — dropdown for picking the user's preferred translation language.
 * When a language is selected (and it's not English), incoming messages will be
 * auto-translated into that language.
 *
 * Props:
 *   onLanguageChange — fn(langCode) called after successful API update
 *   compact          — boolean, renders a small icon-only trigger
 */
const LanguageSelector = ({ onLanguageChange, compact = false }) => {
  const { user, setUser } = useAuth();
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === (user?.language || 'en'))
    || SUPPORTED_LANGUAGES[0];

  const handleSelect = async (lang) => {
    if (lang.code === user?.language) { setOpen(false); return; }
    setSaving(true);
    try {
      const { data } = await updateLanguage(lang.code);
      setUser(data.user);
      onLanguageChange?.(lang.code);
    } catch (err) {
      console.error('Language update failed:', err);
    } finally {
      setSaving(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        disabled={saving}
        className={`flex items-center gap-2 rounded-xl border transition-all
          ${open
            ? 'border-nt-blue/50 bg-nt-blue/10 text-nt-text'
            : 'border-nt-border bg-nt-surface2 text-nt-muted hover:text-nt-text hover:border-nt-blue/30'
          }
          ${compact ? 'px-2 py-1.5' : 'px-3 py-2 w-full'}`}
      >
        <FiGlobe size={13} className={open ? 'text-nt-blue' : ''} />
        {!compact && (
          <>
            <span className="text-sm">{current.flag}</span>
            <span className="text-xs font-medium flex-1 text-left">{current.label}</span>
            {user?.language !== 'en' && (
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-nt-cyan/15 text-nt-cyan border border-nt-cyan/20 font-semibold">
                Auto
              </span>
            )}
            <FiChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
        {compact && (
          <span className="text-sm leading-none">{current.flag}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          <div className="absolute bottom-full left-0 mb-2 w-52 bg-nt-surface border border-nt-border rounded-xl shadow-2xl z-40 overflow-hidden">
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-nt-border bg-nt-surface2/60">
              <p className="text-xs font-semibold text-nt-text">Translation Language</p>
              <p className="text-xs text-nt-muted mt-0.5">Messages auto-translate on receive</p>
            </div>

            {/* Language list */}
            <div className="max-h-52 overflow-y-auto py-1">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === (user?.language || 'en');
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
                      ${isSelected
                        ? 'bg-nt-blue/10 text-nt-text'
                        : 'text-nt-muted hover:bg-nt-surface2 hover:text-nt-text'
                      }`}
                  >
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span className="text-sm flex-1">{lang.label}</span>
                    {isSelected && <FiCheck size={12} className="text-nt-blue flex-shrink-0" />}
                    {lang.code === 'en' && !isSelected && (
                      <span className="text-xs text-nt-muted/60">default</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer note */}
            {user?.language && user.language !== 'en' && (
              <div className="px-3 py-2 border-t border-nt-border bg-nt-cyan/5">
                <p className="text-xs text-nt-cyan/80">
                  🌐 Auto-translating to <strong>{current.label}</strong>
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
