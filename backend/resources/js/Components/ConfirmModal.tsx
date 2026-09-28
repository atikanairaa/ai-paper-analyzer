import React, { useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle, X, ShieldAlert } from 'lucide-react';

type ModalVariant = 'danger' | 'warning' | 'info' | 'success';

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
  iconWrapper: string;
  accentBar: string;
  confirmBtn: string;
  titleColor: string;
  badgeText: string;
  badgeStyle: string;
}> = {
  danger: {
    icon: <ShieldAlert className="w-7 h-7 text-rose-600" />,
    iconWrapper: 'bg-gradient-to-br from-rose-50 to-rose-100 border-2 border-rose-200 shadow-lg shadow-rose-100',
    accentBar: 'from-rose-500 to-rose-600',
    confirmBtn: 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-lg shadow-rose-200',
    titleColor: 'text-stone-900',
    badgeText: 'Perhatian',
    badgeStyle: 'bg-rose-50 text-rose-600 border border-rose-200',
  },
  warning: {
    icon: <AlertTriangle className="w-7 h-7 text-amber-600" />,
    iconWrapper: 'bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 shadow-lg shadow-amber-100',
    accentBar: 'from-amber-400 to-amber-500',
    confirmBtn: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-200',
    titleColor: 'text-stone-900',
    badgeText: 'Peringatan',
    badgeStyle: 'bg-amber-50 text-amber-600 border border-amber-200',
  },
  info: {
    icon: <Info className="w-7 h-7 text-indigo-600" />,
    iconWrapper: 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 shadow-lg shadow-indigo-100',
    accentBar: 'from-indigo-500 to-indigo-600',
    confirmBtn: 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-200',
    titleColor: 'text-stone-900',
    badgeText: 'Konfirmasi',
    badgeStyle: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
  },
  success: {
    icon: <CheckCircle2 className="w-7 h-7 text-emerald-600" />,
    iconWrapper: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 shadow-lg shadow-emerald-100',
    accentBar: 'from-emerald-500 to-emerald-600',
    confirmBtn: 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-200',
    titleColor: 'text-stone-900',
    badgeText: 'Berhasil',
    badgeStyle: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
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
  const isAlertOnly = ALERT_ONLY_VARIANTS.includes(variant);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

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
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={isAlertOnly ? onConfirm : onCancel}
      />

      {/* Modal Card */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-auto overflow-hidden confirm-modal-enter"
      >
        {/* Accent top bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${config.accentBar}`} />

        {/* Close button */}
        <button
          onClick={isAlertOnly ? onConfirm : onCancel}
          className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-7 pt-7 pb-6">
          {/* Icon + Badge */}
          <div className="flex items-start gap-4 mb-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${config.iconWrapper}`}>
              {config.icon}
            </div>
            <div className="flex-1 pt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase mb-2 ${config.badgeStyle}`}>
                {config.badgeText}
              </span>
              <h2
                id="confirm-modal-title"
                className={`text-xl font-bold leading-tight ${config.titleColor}`}
              >
                {title}
              </h2>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent mb-5" />

          {/* Message */}
          <p className="text-sm text-stone-600 leading-relaxed mb-7">
            {message}
          </p>

          {/* Actions */}
          <div className={`flex gap-3 ${isAlertOnly ? 'justify-center' : 'justify-end'}`}>
            {!isAlertOnly && (
              <button
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all focus:outline-none focus:ring-2 focus:ring-stone-200"
              >
                {cancelLabel}
              </button>
            )}
            <button
              onClick={onConfirm}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${config.confirmBtn} ${isAlertOnly ? 'min-w-[130px]' : ''}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .confirm-modal-enter {
          animation: confirmModalPop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes confirmModalPop {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
