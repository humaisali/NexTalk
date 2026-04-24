import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { translateMsg } from '../services/api';

/**
 * useTranslation — dedicated hook for all translation logic.
 *
 * Features:
 *  - Per-message manual translation with result caching
 *  - Auto-translate all new incoming messages when user language ≠ 'en'
 *  - Batch translate existing messages on room join
 *  - Cache prevents re-translating the same message twice
 */
const useTranslation = () => {
  const { user }     = useAuth();

  // { [messageId]: translatedText }
  const [translations,       setTranslations]      = useState({});
  // msgId currently being translated (single)
  const [translationLoading, setTranslationLoading] = useState(null);
  // Track which msgIds have already been translated (prevent duplicates)
  const translatedIds = useRef(new Set());

  // ── Translate a single message ────────────────────────────────
  const translateOne = useCallback(async (messageId, content, targetLanguage) => {
    if (!targetLanguage || targetLanguage === 'en') return;
    if (translatedIds.current.has(messageId))       return; // already done

    setTranslationLoading(messageId);
    try {
      const { data } = await translateMsg(content, targetLanguage);
      if (data.translated && data.translated !== content) {
        translatedIds.current.add(messageId);
        setTranslations((prev) => ({ ...prev, [messageId]: data.translated }));
      }
    } catch (err) {
      console.error('translateOne error:', err.message);
    } finally {
      setTranslationLoading(null);
    }
  }, []);

  // ── Auto-translate a single incoming message ───────────────────
  // Called by ChatWindow/MessageBubble when a new message arrives
  // and user.language is set and != 'en'
  const autoTranslate = useCallback(async (message) => {
    const lang = user?.language;
    if (!lang || lang === 'en')            return;
    if (message.type !== 'text')           return;
    if (translatedIds.current.has(message._id)) return;

    // Don't translate own messages
    const myId = user?._id?.toString();
    const senderId = message.sender?._id?.toString() || message.sender?.toString();
    if (senderId === myId) return;

    await translateOne(message._id, message.content, lang);
  }, [user?.language, user?._id, translateOne]);

  // ── Batch translate room messages on join ─────────────────────
  // Translates up to 10 most recent text messages in the background
  const batchTranslate = useCallback(async (messages) => {
    const lang = user?.language;
    if (!lang || lang === 'en') return;

    const myId = user?._id?.toString();
    const toTranslate = messages
      .filter((m) =>
        m.type === 'text' &&
        !translatedIds.current.has(m._id) &&
        (m.sender?._id?.toString() || m.sender?.toString()) !== myId
      )
      .slice(-10); // limit to last 10 on join

    // Fire all in parallel (no await — runs in background)
    toTranslate.forEach((m) => translateOne(m._id, m.content, lang));
  }, [user?.language, user?._id, translateOne]);

  // ── Reset on room/language change ─────────────────────────────
  const resetTranslations = useCallback(() => {
    setTranslations({});
    translatedIds.current.clear();
    setTranslationLoading(null);
  }, []);

  return {
    translations,
    translationLoading,
    translateOne,
    autoTranslate,
    batchTranslate,
    resetTranslations,
    userLanguage: user?.language || 'en'
  };
};

export default useTranslation;
