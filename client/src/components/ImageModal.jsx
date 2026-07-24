import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function ImageModal({ src, alt = '', onClose }) {
  useEffect(() => {
    const esc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl max-h-[90vh] rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={src} alt={alt} className="max-w-full max-h-full object-contain" />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white hover:text-gray-300"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
}
