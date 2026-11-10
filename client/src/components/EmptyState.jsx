/**
 * Empty state component.
 * Shows when there's no data to display.
 */
import { Link } from 'react-router-dom';
import './EmptyState.css';

export default function EmptyState({ message, linkTo, linkText }) {
  return (
    <div className="empty-state">
      <p className="empty-state-message">{message}</p>
      {linkTo && linkText && (
        <Link to={linkTo} className="empty-state-link">
          {linkText}
        </Link>
      )}
    </div>
  );
}
