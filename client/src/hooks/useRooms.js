import { useState, useEffect, useCallback } from 'react';
import { getRooms, createRoom, getRoomMessages } from '../services/api';
import { useSocket } from '../context/SocketContext';

const useRooms = (toast) => {
  const [rooms,   setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { joinRoom }          = useSocket();

  // ── Fetch all rooms ────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getRooms();
      setRooms(data.rooms || []);
    } catch (err) {
      console.error('fetchRooms error:', err);
      toast?.error('Failed to load rooms. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // ── Create a room ─────────────────────────────────────────────
  const handleCreateRoom = useCallback(async (name, description = '') => {
    if (!name?.trim() || name.trim().length < 2) {
      throw new Error('Room name must be at least 2 characters.');
    }
    const { data } = await createRoom({ name: name.trim(), description: description.trim() });
    setRooms((prev) => [data.room, ...prev]);
    toast?.success(`#${data.room.name} created!`);
    return data.room;
  }, [toast]);

  // ── Select a room ─────────────────────────────────────────────
  const handleSelectRoom = useCallback(async (room) => {
    try {
      const { data } = await getRoomMessages(room._id);
      joinRoom(room, data.messages || []);
    } catch (err) {
      console.error('handleSelectRoom error:', err);
      toast?.warning('Could not load message history. Starting fresh.');
      joinRoom(room, []);
    }
  }, [joinRoom, toast]);

  return { rooms, loading, fetchRooms, handleCreateRoom, handleSelectRoom };
};

export default useRooms;
