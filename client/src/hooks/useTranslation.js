import { useState, useCallback, useEffect } from 'react';
import { translateText as apiTranslateText } from '../services/api';

const useTranslation = (toast) => {
  // Load preferred language from localStorage or default to English
  const [preferredLanguage, setPreferredLanguage] = useState(() => {
    return localStorage.getItem('nextalk_pref_lang') || 'English';
  });

  const [translations, setTranslations] = useState({});
  const [translateLoading, setTranslateLoading] = useState(null);

  // Update localStorage when preference changes
  useEffect(() => {
    localStorage.setItem('nextalk_pref_lang', preferredLanguage);
  }, [preferredLanguage]);

  const translateMessage = useCallback(async (messageId, text) => {
    setTranslateLoading(messageId);
    try {
      const { data } = await apiTranslateText(text, preferredLanguage);
      if (data.translatedText) {
        setTranslations((prev) => ({ ...prev, [messageId]: data.translatedText }));
      }
    } catch (err) {
      console.error('Failed to translate message:', err);
      if (toast) toast.error(err.response?.data?.message || 'Failed to translate message.');
    } finally {
      setTranslateLoading(null);
    }
  }, [preferredLanguage, toast]);

  return {
    preferredLanguage,
    setPreferredLanguage,
    translations,
    translateLoading,
    translateMessage,
  };
};

export default useTranslation;
