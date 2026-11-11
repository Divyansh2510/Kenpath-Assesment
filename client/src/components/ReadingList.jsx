/**
 * Reading list component for a specific date.
 */
import { SLOTS, SLOT_KEYS, MAX_READINGS_PER_DAY } from '../utils/constants';
import './ReadingList.css';

/** Return a status class based on glucose value. */
function getValueStatus(value) {
  const v = Number(value);
  if (v < 70) return 'status-low';
  if (v <= 140) return 'status-normal';
  if (v <= 200) return 'status-high';
  return 'status-very-high';
}

export default function ReadingList({ readings, date, onEdit, onDelete, loading }) {
  // Create a map of readings by slot
  const readingsBySlot = {};
  readings.forEach((reading) => {
    readingsBySlot[reading.slot] = reading;
  });

  const count = readings.length;
  const progressPercent = (count / MAX_READINGS_PER_DAY) * 100;

  return (
    <div className="reading-list">
      <div className="reading-list-header">
        <h3>Readings for {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</h3>
        <p className="reading-count">
          {count} of {MAX_READINGS_PER_DAY} readings recorded
        </p>

        {/* Progress bar */}
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {loading ? (
        <div className="reading-list-loading">
          <span className="spinner">⏳</span> Loading readings…
        </div>
      ) : (
        <div className={`reading-slots${count === 0 ? ' reading-slots--empty' : ''}`}>
          {SLOT_KEYS.map((slotKey) => {
            const reading = readingsBySlot[slotKey];
            const statusClass = reading ? getValueStatus(reading.value) : 'status-empty';

            return (
              <div
                key={slotKey}
                className={`reading-slot-card ${statusClass} ${!reading ? 'slot-empty-card' : ''}`}
              >
                <div className={`slot-color-bar ${statusClass}`} />

                <div className="slot-body">
                  <span className="slot-badge">{SLOTS[slotKey]}</span>

                  {reading ? (
                    <div className="slot-data">
                      <span className="slot-value-lg">{reading.value}</span>
                      <span className="slot-unit">mg/dl</span>
                    </div>
                  ) : (
                    <div className="slot-data slot-data-empty">
                      <span className="slot-empty-text">Not recorded</span>
                    </div>
                  )}
                </div>

                {reading && (
                  <div className="slot-actions">
                    <button
                      onClick={() => onEdit(reading)}
                      className="btn-icon-modern"
                      title="Edit this reading"
                      aria-label="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(reading)}
                      className="btn-icon-modern btn-icon-danger"
                      title="Delete this reading"
                      aria-label="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
