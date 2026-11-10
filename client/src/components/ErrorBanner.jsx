/**
 * Error banner component.
 * Displays error messages at the top of forms or sections.
 */
import './ErrorBanner.css';

export default function ErrorBanner({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert" aria-live="assertive">
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="error-banner-close" aria-label="Close error">
          ×
        </button>
      )}
    </div>
  );
}
