/**
 * Reports page - displays daily, month-to-date, and monthly reports.
 */
import { useState, useEffect } from 'react';
import { getTodayString } from '../utils/dates';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import './Reports.css';

function ReportCard({ report, loading }) {
  if (loading) {
    return <div className="report-card">Loading...</div>;
  }

  const { type, range, stats, readings } = report;

  const isEmpty = stats.count === 0;

  return (
    <div className="report-card">
      <h2>{type === 'daily' ? 'Daily' : type === 'month-to-date' ? 'Month-to-Date' : 'Previous Month'}</h2>
      <p className="report-range">{range.label}</p>

      {isEmpty ? (
        <EmptyState
          message="No readings for this period yet."
          linkTo="/"
          linkText="Add a reading"
        />
      ) : (
        <>
          <div className="report-stats">
            <div className="stat-item">
              <span className="stat-label">Count</span>
              <span className="stat-value">{stats.count}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Highest</span>
              <span className="stat-value highlight">{stats.highest} mg/dl</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Lowest</span>
              <span className="stat-value highlight">{stats.lowest} mg/dl</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average</span>
              <span className="stat-value highlight">{stats.average} mg/dl</span>
            </div>
          </div>

          {type === 'daily' && readings && readings.length > 0 && (
            <div className="daily-readings">
              <h3>Readings</h3>
              {readings.map((reading) => (
                <div key={reading.id} className="reading-item">
                  <span className="reading-slot">{reading.slotLabel}</span>
                  <span className="reading-value">{reading.value} mg/dl</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [dailyReport, setDailyReport] = useState(null);
  const [mtdReport, setMtdReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [selectedDate]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [daily, mtd, monthly] = await Promise.all([
        apiClient.get(`/reports/daily?date=${selectedDate}`),
        apiClient.get(`/reports/month-to-date?date=${selectedDate}`),
        apiClient.get(`/reports/monthly?date=${selectedDate}`),
      ]);

      setDailyReport(daily.data);
      setMtdReport(mtd.data);
      setMonthlyReport(monthly.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports">
      <Navbar />

      <div className="reports-container">
        <h1>Reports</h1>

        <div className="reports-date-picker">
          <label htmlFor="report-date">Selected Date:</label>
          <input
            type="date"
            id="report-date"
            value={selectedDate}
            max={getTodayString()}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="reports-grid">
          {dailyReport && <ReportCard report={dailyReport} loading={loading} />}
          {mtdReport && <ReportCard report={mtdReport} loading={loading} />}
          {monthlyReport && <ReportCard report={monthlyReport} loading={loading} />}
        </div>
      </div>
    </div>
  );
}
