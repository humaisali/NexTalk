import { useState, useCallback } from 'react';
import {
  analyzeTone     as apiTone,
  getSmartReplies as apiReplies,
  summarizeRoom   as apiSummarize,
  explainCode     as apiExplain,
  getRoomMood     as apiMood,
} from '../services/api';

const useAI = (toast) => {

  // ── 1. Tone ─────────────────────────────────────────────────────
  const [toneLoading, setToneLoading] = useState(false);
  const analyzeTone = useCallback(async (message) => {
    setToneLoading(true);
    try { const { data } = await apiTone(message); return data; }
    catch (err) {
      if (toast) toast.error(err.response?.data?.message || 'Tone analysis failed.');
      return { tone: 'neutral', score: 50, suggestion: '' };
    }
    finally { setToneLoading(false); }
  }, [toast]);

  // ── 2. Smart Replies ────────────────────────────────────────────
  const [repliesLoading, setRepliesLoading] = useState(false);
  const fetchSmartReplies = useCallback(async (messages) => {
    if (!messages?.length) return [];
    setRepliesLoading(true);
    try { const { data } = await apiReplies(messages); return data.replies || []; }
    catch (err) {
      if (toast) toast.error(err.response?.data?.message || 'Smart Replies failed.');
      return [];
    }
    finally { setRepliesLoading(false); }
  }, [toast]);

  // ── 3. Summarizer ───────────────────────────────────────────────
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
    } catch (err) {
      if (toast) toast.error(err.response?.data?.message || 'Summary generation failed.');
      setSummary('');
    }
    finally { setSummaryLoading(false); }
  }, [toast]);

  // ── 4. Code Explainer ───────────────────────────────────────────
  const [explanations,   setExplanations]  = useState({});
  const [explainLoading, setExplainLoading] = useState(null);

  const explainCode = useCallback(async (messageId, code, language) => {
    setExplainLoading(messageId);
    try {
      const { data } = await apiExplain(code, language);
      if (data.explanation) setExplanations((prev) => ({ ...prev, [messageId]: data.explanation }));
    } catch (err) {
      if (toast) toast.error(err.response?.data?.message || 'Code explanation failed.');
    }
    finally { setExplainLoading(null); }
  }, [toast]);

  // ── 5. Mood ─────────────────────────────────────────────────────
  const [moodLoading, setMoodLoading] = useState(false);
  const detectMood = useCallback(async (messages) => {
    if (!messages?.length || messages.length < 3) return null;
    setMoodLoading(true);
    try { const { data } = await apiMood(messages); return data; }
    catch (err) {
      if (toast) toast.error(err.response?.data?.message || 'Mood detection failed.');
      return null;
    }
    finally { setMoodLoading(false); }
  }, [toast]);

  return {
    toneLoading, analyzeTone,
    repliesLoading, fetchSmartReplies,
    summary, keyTopics, messageCount, summaryLoading, summarize,
    explanations, explainLoading, explainCode,
    moodLoading, detectMood,
  };
};

export default useAI;
