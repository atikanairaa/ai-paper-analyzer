import React, { useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';

type ModalVariant = 'danger' | 'warning' | 'info' | 'success';

// Variants yang hanya menampilkan satu tombol (tanpa Batal)
const ALERT_ONLY_VARIANTS: ModalVariant[] = ['success', 'info'];

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ModalVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig: Record<ModalVariant, {
  icon: React.ReactNode;
  iconBg: string;
  confirmBtn: string;
  titleColor: string;
}> = {
  danger: {
    icon: <XCircle className="w-6 h-6 text-rose-600" />,
    iconBg: 'bg-rose-100',
    confirmBtn: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-300 text-white',
    titleColor: 'text-rose-900',
  },
  warning: {
    icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    iconBg: 'bg-amber-100',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-300 text-white',
    titleColor: 'text-amber-900',
  },
  info: {
    icon: <Info className="w-6 h-6 text-stone-600" />,
    iconBg: 'bg-stone-100',
    confirmBtn: 'bg-stone-800 hover:bg-stone-900 focus:ring-stone-300 text-white',
    titleColor: 'text-stone-900',
  },
  success: {
    icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
    iconBg: 'bg-emerald-50 border border-emerald-200',
    confirmBtn: 'bg-rose-700 hover:bg-rose-800 focus:ring-rose-300 text-white',
    titleColor: 'text-stone-900',
  },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const config = variantConfig[variant];
  // Untuk variant sukses/info: cukup satu tombol, tanpa Batal
  const isAlertOnly = ALERT_ONLY_VARIANTS.includes(variant);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#e8e4dc] max-w-md w-full mx-auto animate-[fadeInScale_0.2s_ease-out]">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex items-start space-x-4 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
              {config.icon}
            </div>
            <div className="pt-1">
              <h2
                id="confirm-modal-title"
                className={`text-lg font-bold leading-tight ${config.titleColor}`}
              >
                {title}
              </h2>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-stone-600 leading-relaxed mb-6 pl-16">
            {message}
          </p>

          {/* Actions */}
          <div className={`flex items-center pt-4 border-t border-stone-100 ${isAlertOnly ? 'justify-center' : 'justify-end space-x-3'}`}>
            {/* Tombol Batal — hanya muncul untuk variant konfirmasi (danger/warning) */}
            {!isAlertOnly && (
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-[#e8e4dc] text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-200"
              >
                {cancelLabel}
              </button>
            )}
            <button
              onClick={onConfirm}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 ${config.confirmBtn}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
