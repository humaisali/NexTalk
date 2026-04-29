import { useState, useCallback, useRef } from 'react';

let toastId = 0;

/**
 * useToast — manages a list of active toast notifications.
 *
 * Returns:
 *   toasts      — current list of toast objects
 *   addToast    — fn({ type, message, duration? })
 *   removeToast — fn(id)
 *   toast       — shorthand helpers: toast.success(), toast.error(), toast.info(), toast.warning()
 */
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const addToast = useCallback(({ type = 'info', message, duration = 4000 }) => {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-4), { id, type, message }]); // max 5 toasts

    if (duration > 0) {
      timers.current[id] = setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, opts = {}) => addToast({ type: 'success', message: msg, ...opts }),
    error:   (msg, opts = {}) => addToast({ type: 'error',   message: msg, duration: 6000, ...opts }),
    info:    (msg, opts = {}) => addToast({ type: 'info',    message: msg, ...opts }),
    warning: (msg, opts = {}) => addToast({ type: 'warning', message: msg, ...opts }),
  };

  return { toasts, addToast, removeToast, toast };
};

export default useToast;
