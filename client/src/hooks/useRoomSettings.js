import { useState, useCallback } from 'react';
import {
  getRoomDetails, updateRoom, regenerateInvite,
  leaveRoom, kickMember
} from '../services/api';

/**
 * useRoomSettings — manages room settings modal state.
 * Handles loading room details, editing, invite regeneration, leave, kick.
 */
const useRoomSettings = (toast) => {
  const [roomDetails,      setRoomDetails]      = useState(null);
  const [inviteUrl,        setInviteUrl]        = useState('');
  const [loading,          setLoading]          = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [regenerating,     setRegenerating]     = useState(false);

  // ── Load room details + invite URL ────────────────────────────
  const loadRoom = useCallback(async (roomId) => {
    setLoading(true);
    try {
      const { data } = await getRoomDetails(roomId);
      setRoomDetails(data.room);
      setInviteUrl(data.inviteUrl);
    } catch (err) {
      toast?.error('Failed to load room details.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ── Save room edits ───────────────────────────────────────────
  const saveRoom = useCallback(async (roomId, updates) => {
    setSaving(true);
    try {
      const { data } = await updateRoom(roomId, updates);
      setRoomDetails(data.room);
      setInviteUrl(data.inviteUrl);
      toast?.success('Room settings saved!');
      return data.room;
    } catch (err) {
      toast?.error(err?.response?.data?.message || 'Failed to save settings.');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // ── Regenerate invite link ────────────────────────────────────
  const regen = useCallback(async (roomId) => {
    setRegenerating(true);
    try {
      const { data } = await regenerateInvite(roomId);
      setInviteUrl(data.inviteUrl);
      setRoomDetails((prev) => prev ? { ...prev, inviteCode: data.inviteCode } : prev);
      toast?.success('Invite link regenerated!');
      return data.inviteUrl;
    } catch (err) {
      toast?.error('Failed to regenerate invite link.');
    } finally {
      setRegenerating(false);
    }
  }, [toast]);

  // ── Copy invite URL to clipboard ─────────────────────────────
  const copyInvite = useCallback(async (url) => {
    const textToCopy = url || inviteUrl;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for non-secure contexts (like testing on local IP)
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      toast?.success('Invite link copied!');
    } catch (err) {
      console.error(err);
      toast?.error('Could not copy to clipboard.');
    }
  }, [inviteUrl, toast]);

  // ── Leave room ───────────────────────────────────────────────
  const leave = useCallback(async (roomId) => {
    try {
      await leaveRoom(roomId);
      toast?.success('You left the room.');
      return true;
    } catch (err) {
      toast?.error(err?.response?.data?.message || 'Failed to leave room.');
      return false;
    }
  }, [toast]);

  // ── Kick member ──────────────────────────────────────────────
  const kick = useCallback(async (roomId, userId, username) => {
    try {
      await kickMember(roomId, userId);
      setRoomDetails((prev) => prev
        ? { ...prev, members: prev.members.filter((m) => m._id?.toString() !== userId) }
        : prev
      );
      toast?.success(`${username} removed from room.`);
    } catch (err) {
      toast?.error(err?.response?.data?.message || 'Failed to remove member.');
    }
  }, [toast]);

  return {
    roomDetails, inviteUrl, loading, saving, regenerating,
    loadRoom, saveRoom, regen, copyInvite, leave, kick
  };
};

export default useRoomSettings;
