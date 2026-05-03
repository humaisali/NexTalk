import { useState, useEffect, useCallback } from 'react';
import { getRooms, createRoom, getRoomMessages, joinRoomByInvite } from '../services/api';
import { useSocket } from '../context/SocketContext';

const useRooms = (toast) => {
  const [rooms,   setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { joinRoom }          = useSocket();

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getRooms();
      setRooms(data.rooms || []);
    } catch (err) {
      console.error('fetchRooms:', err);
      toast?.error('Failed to load groups. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const handleCreateRoom = useCallback(async (name, description = '') => {
    if (!name?.trim() || name.trim().length < 2)
      throw new Error('Group name must be at least 2 characters.');
    const { data } = await createRoom({ name: name.trim(), description: description.trim() });
    setRooms((prev) => [data.room, ...prev]);
    toast?.success(`Group "${data.room.name}" created!`);
    return data.room;
  }, []);

  const handleSelectRoom = useCallback(async (room) => {
    try {
      const { data } = await getRoomMessages(room._id);
      joinRoom(room, data.messages || []);
    } catch (err) {
      console.error('handleSelectRoom:', err);
      if (err?.response?.status === 403) {
        toast?.error('You are no longer a member of this group.');
        setRooms((prev) => prev.filter((r) => r._id !== room._id));
        return;
      }
      toast?.warning('Could not load message history. Starting fresh.');
      joinRoom(room, []);
    }
  }, [joinRoom]);

  // Join via invite link URL or raw invite code
  const handleJoinByCode = useCallback(async (input) => {
    // Extract the code whether input is a full URL or just the code string
    let code = input.trim();

    // If it looks like a URL, extract the last path segment
    if (code.includes('/')) {
      const parts = code.split('/').filter(Boolean);
      code = parts[parts.length - 1];
    }

    if (!code) throw new Error('Invalid invite link or code.');

    const { data } = await joinRoomByInvite(code);

    const room = data.room;

    // Add to list if not already there
    setRooms((prev) => {
      const exists = prev.some((r) => r._id === room._id);
      return exists ? prev : [room, ...prev];
    });

    toast?.success(data.alreadyMember ? `Already in "${room.name}"` : `Joined "${room.name}"!`);

    // Navigate into the room
    await handleSelectRoom(room);

    return room;
  }, [handleSelectRoom]);

  // Called after joining via the JoinRoom page
  const handleJoinAndOpen = useCallback(async (room) => {
    setRooms((prev) => {
      const exists = prev.some((r) => r._id === room._id);
      return exists ? prev : [room, ...prev];
    });
    await handleSelectRoom(room);
  }, [handleSelectRoom]);

  const updateRoomInList = useCallback((updatedRoom) => {
    setRooms((prev) =>
      prev.map((r) => r._id === updatedRoom._id ? { ...r, ...updatedRoom } : r)
    );
  }, []);

  const removeRoomFromList = useCallback((roomId) => {
    setRooms((prev) => prev.filter((r) => r._id !== roomId));
  }, []);

  return {
    rooms, loading, fetchRooms,
    handleCreateRoom, handleSelectRoom,
    handleJoinByCode, handleJoinAndOpen,
    updateRoomInList, removeRoomFromList,
  };
};

export default useRooms;
