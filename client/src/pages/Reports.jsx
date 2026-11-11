/**
 * Reports page - displays daily, month-to-date, and monthly reports.
 */
import { useState, useEffect } from 'react';
import { getTodayString } from '../utils/dates';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import './Reports.css';

function requestReports(date) {
  return Promise.all([
    apiClient.get(`/reports/daily?date=${date}`),
    apiClient.get(`/reports/month-to-date?date=${date}`),
    apiClient.get(`/reports/monthly?date=${date}`),
  ]);
}

function ReportCard({ report, loading }) {
  if (loading) {
    return (
      <div className="report-card report-card-loading" role="status" aria-live="polite">
        Loading report…
      </div>
    );
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
              <span className="stat-value highlight">{Number(stats.average).toFixed(1)} mg/dl</span>
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
  const [loadedDate, setLoadedDate] = useState(null);
  const [reportsErrorState, setReportsError] = useState({ date: '', message: '' });
  const loading = loadedDate !== selectedDate;
  const reportsError = reportsErrorState.date === selectedDate ? reportsErrorState.message : '';

  useEffect(() => {
    let active = true;

    requestReports(selectedDate)
      .then(([daily, mtd, monthly]) => {
        if (!active) return;
        setDailyReport(daily.data);
        setMtdReport(mtd.data);
        setMonthlyReport(monthly.data);
        setReportsError({ date: selectedDate, message: '' });
      })
      .catch((error) => {
        if (!active) return;
        console.error('Failed to fetch reports:', error);
        setDailyReport(null);
        setMtdReport(null);
        setMonthlyReport(null);
        setReportsError({
          date: selectedDate,
          message: 'Unable to load reports. Please try again.',
        });
      })
      .finally(() => {
        if (active) setLoadedDate(selectedDate);
      });

    return () => {
      active = false;
    };
  }, [selectedDate]);

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

        <ErrorBanner
          message={reportsError}
          onClose={() => setReportsError({ date: selectedDate, message: '' })}
        />

        <div className="reports-grid">
          {(dailyReport || loading) && <ReportCard report={dailyReport} loading={loading} />}
          {(mtdReport || loading) && <ReportCard report={mtdReport} loading={loading} />}
          {(monthlyReport || loading) && <ReportCard report={monthlyReport} loading={loading} />}
        </div>
      </div>
    </div>
  );
}
