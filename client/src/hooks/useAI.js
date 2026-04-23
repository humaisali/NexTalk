import { useState, useCallback } from 'react';
import {
  analyzeTone     as apiTone,
  getSmartReplies as apiReplies,
  summarizeRoom   as apiSummarize,
  translateMsg    as apiTranslate,
  explainCode     as apiExplain,
  getRoomMood     as apiMood
} from '../services/api';

/**
 * useAI — centralises all 6 Gemini AI feature calls.
 * Day 5: summarize now also returns keyTopics + messageCount.
 */
const useAI = () => {

  // ── 1. Tone Analyzer ───────────────────────────────────────────
  const [toneLoading, setToneLoading] = useState(false);

  const analyzeTone = useCallback(async (message) => {
    setToneLoading(true);
    try {
      const { data } = await apiTone(message);
      return data;
    } catch {
      return { tone: 'neutral', score: 50, suggestion: '' };
    } finally {
      setToneLoading(false);
    }
  }, []);

  // ── 2. Smart Replies ───────────────────────────────────────────
  const [repliesLoading, setRepliesLoading] = useState(false);

  const fetchSmartReplies = useCallback(async (messages) => {
    if (!messages?.length) return [];
    setRepliesLoading(true);
    try {
      const { data } = await apiReplies(messages);
      return data.replies || [];
    } catch {
      return [];
    } finally {
      setRepliesLoading(false);
    }
  }, []);

  // ── 3. Catch Me Up Summarizer (Day 5: keyTopics + messageCount) ─
  const [summary,        setSummary]        = useState('');
  const [keyTopics,      setKeyTopics]      = useState([]);
  const [messageCount,   setMessageCount]   = useState(0);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const summarize = useCallback(async (messages) => {
    if (!messages?.length) return;
    setSummaryLoading(true);
    setSummary(''); setKeyTopics([]); setMessageCount(0);
    try {
      const { data } = await apiSummarize(messages);
      setSummary(data.summary || '');
      setKeyTopics(data.keyTopics || []);
      setMessageCount(data.messageCount || messages.length);
    } catch {
      setSummary('');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // ── 4. Real-Time Translation ───────────────────────────────────
  const [translations,       setTranslations]      = useState({});
  const [translationLoading, setTranslationLoading] = useState(null);

  const translateMessage = useCallback(async (messageId, content, targetLanguage) => {
    if (!targetLanguage || targetLanguage === 'en') return;
    setTranslationLoading(messageId);
    try {
      const { data } = await apiTranslate(content, targetLanguage);
      setTranslations((prev) => ({ ...prev, [messageId]: data.translated }));
    } catch { /* silent */ } finally {
      setTranslationLoading(null);
    }
  }, []);

  // ── 5. Code Explainer ──────────────────────────────────────────
  const [explanations,   setExplanations]  = useState({});
  const [explainLoading, setExplainLoading] = useState(null);

  const explainCode = useCallback(async (messageId, code, language) => {
    setExplainLoading(messageId);
    try {
      const { data } = await apiExplain(code, language);
      if (data.explanation) {
        setExplanations((prev) => ({ ...prev, [messageId]: data.explanation }));
      }
    } catch { /* silent */ } finally {
      setExplainLoading(null);
    }
  }, []);

  // ── 6. Mood Detector ───────────────────────────────────────────
  const [moodLoading, setMoodLoading] = useState(false);

  const detectMood = useCallback(async (messages, roomId) => {
    if (!messages?.length || messages.length < 3) return null;
    setMoodLoading(true);
    try {
      const { data } = await apiMood(messages);
      return data;
    } catch {
      return null;
    } finally {
      setMoodLoading(false);
    }
  }, []);

  return {
    // Tone
    toneLoading, analyzeTone,
    // Smart replies
    repliesLoading, fetchSmartReplies,
    // Summarizer
    summary, keyTopics, messageCount, summaryLoading, summarize,
    // Translation
    translations, translationLoading, translateMessage,
    // Code explainer
    explanations, explainLoading, explainCode,
    // Mood
    moodLoading, detectMood
  };
};

export default useAI;
