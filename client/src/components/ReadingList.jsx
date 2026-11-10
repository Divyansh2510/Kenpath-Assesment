/**
 * Reading list component for a specific date.
 */
import { SLOTS, SLOT_KEYS, MAX_READINGS_PER_DAY } from '../utils/constants';
import './ReadingList.css';

export default function ReadingList({ readings, date, onEdit, onDelete, loading }) {
  // Create a map of readings by slot
  const readingsBySlot = {};
  readings.forEach((reading) => {
    readingsBySlot[reading.slot] = reading;
  });

  const handleDelete = async (reading) => {
    if (window.confirm(`Delete ${reading.slotLabel} reading (${reading.value} mg/dl)?`)) {
      await onDelete(reading.id);
    }
  };

  const count = readings.length;

  return (
    <div className="reading-list">
      <div className="reading-list-header">
        <h3>Readings for {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</h3>
        <p className="reading-count">
          You have recorded {count} of {MAX_READINGS_PER_DAY} readings today
        </p>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="reading-slots">
          {SLOT_KEYS.map((slotKey) => {
            const reading = readingsBySlot[slotKey];
            return (
              <div key={slotKey} className="reading-slot">
                <div className="slot-label">{SLOTS[slotKey]}</div>
                {reading ? (
                  <div className="slot-content">
                    <span className="slot-value">{reading.value} mg/dl</span>
                    <div className="slot-actions">
                      <button
                        onClick={() => onEdit(reading)}
                        className="btn-icon"
                        aria-label="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(reading)}
                        className="btn-icon"
                        aria-label="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="slot-empty">Not recorded</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
