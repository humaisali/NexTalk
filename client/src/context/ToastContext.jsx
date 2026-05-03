import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Check, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);
let _id = 0;

const CONFIGS = {
  success: { icon: Check,         color: '#4ADE80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.3)'   },
  error:   { icon: AlertCircle,   color: '#F87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.3)'  },
  info:    { icon: Info,          color: '#60D4C8', bg: 'rgba(96,212,200,0.1)',   border: 'rgba(96,212,200,0.3)'   },
  warning: { icon: AlertTriangle, color: '#FCD34D', bg: 'rgba(252,211,77,0.1)',   border: 'rgba(252,211,77,0.3)'   },
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
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => {
            const cfg  = CONFIGS[t.type] || CONFIGS.info;
            const Icon = cfg.icon;
            return (
              <div key={t.id}
                className="flex items-start gap-3 px-4 py-3 rounded-nt max-w-sm w-full pointer-events-auto animate-toast-in border shadow-nt-float"
                style={{ background: '#012B26', borderColor: cfg.border }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                     style={{ background: cfg.bg }}>
                  <Icon size={13} style={{ color: cfg.color }} />
                </div>
                <span className="text-sm flex-1 leading-snug" style={{ color: '#FFEFB2' }}>{t.message}</span>
                <button onClick={() => remove(t.id)} className="flex-shrink-0 mt-0.5 transition-colors"
                        style={{ color: '#7A9E99' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#FFEFB2'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}>
                  <X size={13} />
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
