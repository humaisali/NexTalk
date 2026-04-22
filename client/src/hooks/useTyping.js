import { useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

// Emits typing → stops after 2s of no input
const useTyping = () => {
  const { emitTyping, emitStopTyping } = useSocket();
  const timerRef = useRef(null);
  const isTyping = useRef(false);

  const handleTyping = useCallback(() => {
    if (!isTyping.current) {
      emitTyping();
      isTyping.current = true;
    }

    // Reset the stop timer on every keystroke
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      emitStopTyping();
      isTyping.current = false;
    }, 2000);
  }, [emitTyping, emitStopTyping]);

  const cancelTyping = useCallback(() => {
    clearTimeout(timerRef.current);
    if (isTyping.current) {
      emitStopTyping();
      isTyping.current = false;
    }
  }, [emitStopTyping]);

  return { handleTyping, cancelTyping };
};

export default useTyping;
