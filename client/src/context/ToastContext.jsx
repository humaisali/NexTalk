import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Check, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);
let _id = 0;

const CONFIGS = {
  success: { icon: Check,         color: '#4ADE80', bg: 'rgba(8,14,13,0.95)', border: 'rgba(74,222,128,0.25)',   glow: 'rgba(74,222,128,0.15)'  },
  error:   { icon: AlertCircle,   color: '#F87171', bg: 'rgba(8,14,13,0.95)', border: 'rgba(248,113,113,0.25)',  glow: 'rgba(248,113,113,0.12)' },
  info:    { icon: Info,          color: '#60D4C8', bg: 'rgba(8,14,13,0.95)', border: 'rgba(96,212,200,0.25)',   glow: 'rgba(96,212,200,0.1)'   },
  warning: { icon: AlertTriangle, color: '#FCD34D', bg: 'rgba(8,14,13,0.95)', border: 'rgba(252,211,77,0.25)',   glow: 'rgba(252,211,77,0.1)'   },
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
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none">
          {toasts.map((t) => {
            const cfg  = CONFIGS[t.type] || CONFIGS.info;
            const Icon = cfg.icon;
            return (
              <div
                key={t.id}
                className="flex items-start gap-3 px-4 py-3 rounded-2xl max-w-sm w-full pointer-events-auto animate-toast-in"
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  boxShadow: `0 8px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,239,178,0.03), 0 0 20px ${cfg.glow}`,
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: `${cfg.color}15`,
                    border: `1px solid ${cfg.border}`,
                  }}
                >
                  <Icon size={13} style={{ color: cfg.color }} />
                </div>
                <span className="text-sm flex-1 leading-snug" style={{ color: '#FFEFB2' }}>{t.message}</span>
                <button
                  onClick={() => remove(t.id)}
                  className="flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 transition-all"
                  style={{ color: 'rgba(122,158,153,0.5)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#FFEFB2'; e.currentTarget.style.background = 'rgba(255,239,178,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(122,158,153,0.5)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <X size={11} />
                </button>
              </div>
            );
          })}
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
