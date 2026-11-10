/**
 * Reading form component for add/edit.
 * Date is controlled by parent component (Dashboard).
 */
import { useState, useEffect } from 'react';
import { SLOTS, SLOT_KEYS } from '../utils/constants';
import { validateReading } from '../utils/validation';
import ErrorBanner from './ErrorBanner';
import './ReadingForm.css';

export default function ReadingForm({ reading, onSubmit, onCancel, loading, selectedDate }) {
  const [formData, setFormData] = useState({
    slot: reading?.slot || '',
    value: reading?.value || '',
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Update form when reading prop changes (editing mode)
  useEffect(() => {
    if (reading) {
      setFormData({
        slot: reading.slot,
        value: reading.value,
      });
    } else {
      // Reset when switching back to add mode
      setFormData({
        slot: '',
        value: '',
      });
    }
  }, [reading]);

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

    // Add the selected date to form data
    const submitData = {
      ...formData,
      date: selectedDate,
    };

    // Client-side validation
    const validation = validateReading(submitData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await onSubmit(submitData);
      // Reset form on success (only for add mode)
      if (!reading) {
        setFormData({
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

  const isEditing = !!reading;

  return (
    <div className="reading-form">
      <div className="reading-form-accent"></div>

      <div className="reading-form-header">
        <h3>{isEditing ? '✏️ Edit Reading' : '➕ Add New Reading'}</h3>
        {isEditing && <span className="mode-badge mode-edit">Editing</span>}
        {!isEditing && <span className="mode-badge mode-add">New</span>}
      </div>

      <ErrorBanner message={generalError} onClose={() => setGeneralError('')} />

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="slot">Time Slot</label>
          <div className="select-wrapper">
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
          </div>
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
            {loading ? 'Saving...' : isEditing ? 'Update Reading' : 'Save Reading'}
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
