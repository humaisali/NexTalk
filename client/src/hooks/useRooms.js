import { useState, useEffect, useCallback } from 'react';
import { getRooms, createRoom, getRoomMessages } from '../services/api';
import { useSocket } from '../context/SocketContext';

const useRooms = () => {
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const { joinRoom }          = useSocket();

  // Fetch all rooms on mount
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getRooms();
      setRooms(data.rooms);
    } catch {
      setError('Failed to load rooms.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // Create a new room
  const handleCreateRoom = async (name, description = '') => {
    const { data } = await createRoom({ name, description });
    setRooms((prev) => [data.room, ...prev]);
    return data.room;
  };

  // Select a room — fetch its messages, then join via socket
  const handleSelectRoom = async (room) => {
    try {
      const { data } = await getRoomMessages(room._id);
      joinRoom(room, data.messages);
    } catch {
      joinRoom(room, []);
    }
  };

  return {
    rooms,
    loading,
    error,
    fetchRooms,
    handleCreateRoom,
    handleSelectRoom
  };
};

export default useRooms;
