import { useEffect } from 'react';
import './Toast.css';

export default function Toast({ toast, onDismiss, onConfirm, onCancel }) {
  useEffect(() => {
    if (!toast || toast.type === 'confirm') return undefined;

    const timeout = window.setTimeout(onDismiss, 3500);
    return () => window.clearTimeout(timeout);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isConfirmation = toast.type === 'confirm';

  return (
    <div
      className={`toast toast--${toast.type}`}
      role={isConfirmation ? 'alertdialog' : 'status'}
      aria-live={isConfirmation ? 'assertive' : 'polite'}
      aria-label={isConfirmation ? 'Confirm deletion' : undefined}
    >
      <span className="toast-message">{toast.message}</span>
      {isConfirmation ? (
        <div className="toast-actions">
          <button type="button" className="toast-action toast-action--confirm" onClick={onConfirm}>
            Delete
          </button>
          <button type="button" className="toast-action" onClick={onCancel}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" className="toast-close" onClick={onDismiss} aria-label="Dismiss notification">
          ×
        </button>
      )}
    </div>
  );
}
