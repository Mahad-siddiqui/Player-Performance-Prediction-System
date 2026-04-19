import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

export default function GlassModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
}: GlassModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-dark-900/80 modal-overlay"
        onClick={onClose}
      />
      <div
        className={`
          relative w-full ${sizeMap[size]} max-h-[90vh] overflow-y-auto
          rounded-2xl border border-white/10
          bg-dark-700/95 backdrop-blur-2xl
          shadow-[0_25px_60px_rgba(0,0,0,0.6)]
          animate-[slideIn_0.3s_ease-out]
        `}
        style={{ animation: 'slideIn 0.3s ease-out' }}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
            <h2 className="text-xl font-bold text-gradient-green">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
