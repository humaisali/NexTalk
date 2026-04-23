import { useState, useCallback } from 'react';

const CODE_LANGUAGES = [
  'javascript', 'typescript', 'python', 'jsx', 'tsx',
  'css', 'html', 'java', 'cpp', 'rust', 'go',
  'bash', 'sql', 'json', 'yaml', 'php', 'ruby', 'swift'
];

/**
 * useCodeShare — manages the code-sharing mode in the message input.
 * Keeps code content, language selection, preview visibility, and
 * provides a clean reset utility.
 */
const useCodeShare = () => {
  const [isCodeMode,   setIsCodeMode]   = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [showPreview,  setShowPreview]  = useState(false);

  const enableCodeMode  = useCallback(() => { setIsCodeMode(true);  setShowPreview(false); }, []);
  const disableCodeMode = useCallback(() => { setIsCodeMode(false); setShowPreview(false); setCodeLanguage('javascript'); }, []);
  const toggleCodeMode  = useCallback(() => { if (isCodeMode) disableCodeMode(); else enableCodeMode(); }, [isCodeMode]);
  const togglePreview   = useCallback(() => setShowPreview((p) => !p), []);

  return {
    isCodeMode,
    codeLanguage,
    setCodeLanguage,
    showPreview,
    enableCodeMode,
    disableCodeMode,
    toggleCodeMode,
    togglePreview,
    CODE_LANGUAGES
  };
};

export default useCodeShare;
