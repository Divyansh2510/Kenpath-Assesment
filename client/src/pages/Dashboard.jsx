/**
 * Dashboard page - main page for managing readings.
 */
import { useState, useEffect } from 'react';
import { getTodayString } from '../utils/dates';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';
import ReadingForm from '../components/ReadingForm';
import ReadingList from '../components/ReadingList';
import './Dashboard.css';

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [readings, setReadings] = useState([]);
  const [editingReading, setEditingReading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchReadings();
  }, [selectedDate]);

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/readings?date=${selectedDate}`);
      setReadings(response.data.data);
    } catch (error) {
      console.error('Failed to fetch readings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    setFormLoading(true);
    try {
      await apiClient.post('/readings', formData);
      await fetchReadings();
      // Show success message could be added here
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (formData) => {
    setFormLoading(true);
    try {
      await apiClient.put(`/readings/${editingReading.id}`, formData);
      setEditingReading(null);
      await fetchReadings();
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/readings/${id}`);
      await fetchReadings();
    } catch (error) {
      console.error('Failed to delete reading:', error);
      alert('Failed to delete reading. Please try again.');
    }
  };

  const handleEdit = (reading) => {
    setEditingReading(reading);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingReading(null);
  };

  return (
    <div className="dashboard">
      <Navbar />

      <div className="dashboard-container">
        <h1>Dashboard</h1>

        <div className="date-picker-section">
          <label htmlFor="date-picker">Select Date:</label>
          <input
            type="date"
            id="date-picker"
            value={selectedDate}
            max={getTodayString()}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <ReadingForm
          reading={editingReading}
          onSubmit={editingReading ? handleUpdate : handleCreate}
          onCancel={editingReading ? handleCancelEdit : null}
          loading={formLoading}
        />

        <ReadingList
          readings={readings}
          date={selectedDate}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>
    </div>
  );
}
