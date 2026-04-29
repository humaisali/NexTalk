import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { FiCheck, FiX, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';

const ToastContext = createContext(null);

let _id = 0;

const ICONS = {
  success: <FiCheck      size={15} />,
  error:   <FiAlertCircle size={15} />,
  info:    <FiInfo        size={15} />,
  warning: <FiAlertTriangle size={15} />,
};

const STYLES = {
  success: 'border-nt-success/40 bg-nt-success/10 text-nt-success',
  error:   'border-nt-danger/40  bg-nt-danger/10  text-nt-danger',
  info:    'border-nt-blue/40    bg-nt-blue/10    text-nt-blue',
  warning: 'border-nt-warning/40 bg-nt-warning/10 text-nt-warning',
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers              = useRef({});

  const remove = useCallback((id) => {
    setToasts((p) => p.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const add = useCallback(({ type = 'info', message, duration = 4000 }) => {
    const id = ++_id;
    setToasts((p) => [...p.slice(-4), { id, type, message }]);
    if (duration > 0) timers.current[id] = setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  const toast = {
    success: (msg, opts = {}) => add({ type: 'success', message: msg, ...opts }),
    error:   (msg, opts = {}) => add({ type: 'error',   message: msg, duration: 6000, ...opts }),
    info:    (msg, opts = {}) => add({ type: 'info',    message: msg, ...opts }),
    warning: (msg, opts = {}) => add({ type: 'warning', message: msg, ...opts }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast portal */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-sm
                max-w-sm w-full pointer-events-auto animate-toast-in ${STYLES[t.type] || STYLES.info}`}
            >
              <span className="flex-shrink-0 mt-0.5">{ICONS[t.type]}</span>
              <span className="text-sm flex-1 leading-snug">{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
              >
                <FiX size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

export default ToastContext;
