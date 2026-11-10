/**
 * Reading form component for add/edit.
 */
import { useState, useEffect } from 'react';
import { SLOTS, SLOT_KEYS } from '../utils/constants';
import { validateReading } from '../utils/validation';
import { getTodayString } from '../utils/dates';
import ErrorBanner from './ErrorBanner';
import './ReadingForm.css';

export default function ReadingForm({ reading, onSubmit, onCancel, loading, defaultDate }) {
  const [formData, setFormData] = useState({
    date: reading?.date || defaultDate || getTodayString(),
    slot: reading?.slot || '',
    value: reading?.value || '',
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Update form when reading prop changes (editing mode)
  useEffect(() => {
    if (reading) {
      setFormData({
        date: reading.date,
        slot: reading.slot,
        value: reading.value,
      });
    }
  }, [reading]);

  // Sync form date with defaultDate when not editing
  useEffect(() => {
    if (!reading && defaultDate) {
      setFormData((prev) => ({ ...prev, date: defaultDate }));
    }
  }, [defaultDate, reading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    // Client-side validation
    const validation = validateReading(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form on success (only for add mode)
      if (!reading) {
        setFormData({
          date: defaultDate || getTodayString(),
          slot: '',
          value: '',
        });
      }
    } catch (error) {
      if (error.response?.data?.error) {
        const { message, fields } = error.response.data.error;
        setGeneralError(message);
        if (fields) {
          setErrors(fields);
        }
      } else {
        setGeneralError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="reading-form">
      <h3>{reading ? 'Edit Reading' : 'Add New Reading'}</h3>

      <ErrorBanner message={generalError} onClose={() => setGeneralError('')} />

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            max={getTodayString()}
            onChange={handleChange}
            className={errors.date ? 'input-error' : ''}
            required
          />
          {errors.date && (
            <span className="field-error" role="alert">
              {errors.date}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="slot">Time Slot</label>
          <select
            id="slot"
            name="slot"
            value={formData.slot}
            onChange={handleChange}
            className={errors.slot ? 'input-error' : ''}
            required
          >
            <option value="">Select a time slot</option>
            {SLOT_KEYS.map((key) => (
              <option key={key} value={key}>
                {SLOTS[key]}
              </option>
            ))}
          </select>
          {errors.slot && (
            <span className="field-error" role="alert">
              {errors.slot}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="value">Glucose Value (mg/dl)</label>
          <input
            type="number"
            id="value"
            name="value"
            value={formData.value}
            onChange={handleChange}
            className={errors.value ? 'input-error' : ''}
            placeholder="e.g., 120"
            required
          />
          {errors.value && (
            <span className="field-error" role="alert">
              {errors.value}
            </span>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
