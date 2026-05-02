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
      toast?.error('Failed to load rooms. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const handleCreateRoom = useCallback(async (name, description = '') => {
    if (!name?.trim() || name.trim().length < 2)
      throw new Error('Room name must be at least 2 characters.');
    const { data } = await createRoom({ name: name.trim(), description: description.trim() });
    setRooms((prev) => [data.room, ...prev]);
    toast?.success(`#${data.room.name} created!`);
    return data.room;
  }, []);

  const handleSelectRoom = useCallback(async (room) => {
    try {
      const { data } = await getRoomMessages(room._id);
      joinRoom(room, data.messages || []);
    } catch (err) {
      console.error('handleSelectRoom:', err);
      // If forbidden, user is no longer a member
      if (err?.response?.status === 403) {
        toast?.error('You are no longer a member of this room.');
        setRooms((prev) => prev.filter((r) => r._id !== room._id));
        return;
      }
      toast?.warning('Could not load message history. Starting fresh.');
      joinRoom(room, []);
    }
  }, [joinRoom]);

  // Called after joining via invite link
  const handleJoinAndOpen = useCallback(async (room) => {
    setRooms((prev) => {
      const exists = prev.some((r) => r._id === room._id);
      return exists ? prev : [room, ...prev];
    });
    await handleSelectRoom(room);
  }, [handleSelectRoom]);

  // Update a room in the local list (after settings change)
  const updateRoomInList = useCallback((updatedRoom) => {
    setRooms((prev) =>
      prev.map((r) => r._id === updatedRoom._id ? { ...r, ...updatedRoom } : r)
    );
  }, []);

  // Remove a room from the local list (after leave)
  const removeRoomFromList = useCallback((roomId) => {
    setRooms((prev) => prev.filter((r) => r._id !== roomId));
  }, []);

  return {
    rooms, loading, fetchRooms,
    handleCreateRoom, handleSelectRoom,
    handleJoinAndOpen, updateRoomInList, removeRoomFromList
  };
};

export default useRooms;
