/**
 * Dashboard page - main page for managing readings.
 */
import { useState, useEffect, useMemo } from 'react';
import { getTodayString } from '../utils/dates';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';
import ReadingForm from '../components/ReadingForm';
import ReadingList from '../components/ReadingList';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
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

  /* ---------- Quick stats ---------- */
  const stats = useMemo(() => {
    const count = readings.length;
    if (count === 0) return { count: 0, average: 0, status: 'No data', statusClass: 'stat-none' };
    const sum = readings.reduce((acc, r) => acc + Number(r.value), 0);
    const avg = Math.round(sum / count);
    let status = 'Normal';
    let statusClass = 'stat-normal';
    if (avg < 70) { status = 'Low'; statusClass = 'stat-low'; }
    else if (avg > 140) { status = 'High'; statusClass = 'stat-high'; }
    return { count, average: avg, status, statusClass };
  }, [readings]);

  /* ---------- Date navigation ---------- */
  const navigateDate = (direction) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + direction);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const newDate = `${yyyy}-${mm}-${dd}`;
    if (newDate <= getTodayString()) setSelectedDate(newDate);
  };

  const friendlyDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isToday = selectedDate === getTodayString();

  /* ---------- Greeting ---------- */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="dashboard">
      <Navbar />

      <div className="dashboard-container fade-in-up">
        {/* Welcome banner */}
        <div className="welcome-banner">
          <div className="welcome-text">
            <h1>{greeting}, {displayName} 👋</h1>
            <p className="welcome-date">{friendlyDate}</p>
          </div>

          <div className="quick-stats">
            <div className="stat-card">
              <span className="stat-icon">📊</span>
              <span className="stat-number">{stats.count}</span>
              <span className="stat-label">Readings</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📈</span>
              <span className="stat-number">{stats.average || '—'}</span>
              <span className="stat-label">Avg mg/dl</span>
            </div>
            <div className={`stat-card ${stats.statusClass}`}>
              <span className="stat-icon">
                {stats.status === 'Normal' ? '✅' : stats.status === 'High' ? '⚠️' : stats.status === 'Low' ? '🔻' : '➖'}
              </span>
              <span className="stat-number">{stats.status}</span>
              <span className="stat-label">Status</span>
            </div>
          </div>
        </div>

        {/* Date picker card */}
        <div className="date-picker-card">
          <button
            className="date-nav-btn"
            onClick={() => navigateDate(-1)}
            title="Previous day"
          >
            ← Yesterday
          </button>

          <div className="date-picker-center">
            <span className="date-friendly">{friendlyDate}</span>
            <input
              type="date"
              id="date-picker"
              value={selectedDate}
              max={getTodayString()}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <button
            className="date-nav-btn"
            onClick={() => navigateDate(1)}
            disabled={isToday}
            title="Next day"
          >
            Tomorrow →
          </button>
        </div>

        {/* Main content */}
        <div className="dashboard-content">
          <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
            <ReadingForm
              reading={editingReading}
              onSubmit={editingReading ? handleUpdate : handleCreate}
              onCancel={editingReading ? handleCancelEdit : null}
              loading={formLoading}
              selectedDate={selectedDate}
            />
          </div>

          <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
            <ReadingList
              readings={readings}
              date={selectedDate}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
