import { useState, useEffect } from 'react';
import { useRefreshOnNavigate } from '../../hooks/useRefreshOnNavigate';
import { CaretLeft, CaretRight, ChartLine, Calendar, CurrencyDollar, FileText } from '@phosphor-icons/react';
import './DoctorEarnings.css';

interface DailyEarning {
  date: string;
  earnings: number;
  appointments: number;
  appointmentIds: string[];
}

interface EarningsData {
  doctorId: string;
  period: string;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  summary: {
    totalEarnings: number;
    totalAppointments: number;
    averagePerAppointment: number | string;
  };
  dailyEarnings: DailyEarning[];
}

export default function DoctorEarnings() {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
  const token = localStorage.getItem('authToken');

  const fetchEarnings = async () => {
    if (!user?._id || !token) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        period: 'day'
      });

      const response = await fetch(
        `http://localhost:4000/api/payments/doctor/${user._id}/earnings?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch earnings');
      }

      const data = await response.json();
      setEarnings(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh earnings data when navigating to this page
  useRefreshOnNavigate(fetchEarnings);

  useEffect(() => {
    fetchEarnings();
  }, [dateRange]);

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreviousPeriod = () => {
    const days = 30;
    const newEndDate = new Date(dateRange.startDate);
    newEndDate.setDate(newEndDate.getDate() - 1);
    const newStartDate = new Date(newEndDate);
    newStartDate.setDate(newStartDate.getDate() - days + 1);

    setDateRange({
      startDate: newStartDate.toISOString().split('T')[0],
      endDate: newEndDate.toISOString().split('T')[0]
    });
  };

  const handleNextPeriod = () => {
    const days = 30;
    const newStartDate = new Date(dateRange.endDate);
    newStartDate.setDate(newStartDate.getDate() + 1);
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + days - 1);

    // Don't go beyond today
    const today = new Date();
    if (newEndDate > today) {
      newEndDate.setTime(today.getTime());
    }

    setDateRange({
      startDate: newStartDate.toISOString().split('T')[0],
      endDate: newEndDate.toISOString().split('T')[0]
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !earnings) {
    return (
      <div className="earnings-container">
        <div className="skeleton-loader">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-table"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="earnings-container">
      {/* Header */}
      <div className="earnings-header">
        <div>
          <h1 className="earnings-title">Your Earnings</h1>
          <p className="earnings-subtitle">Track your daily income and appointment statistics</p>
        </div>
        <div className="earnings-icon">
          <ChartLine size={32} weight="duotone" />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      {earnings && (
        <>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon primary">
                <CurrencyDollar size={24} weight="duotone" />
              </div>
              <div className="card-content">
                <p className="card-label">Total Earnings</p>
                <h3 className="card-value">{formatCurrency(earnings.summary.totalEarnings)}</h3>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon success">
                <Calendar size={24} weight="duotone" />
              </div>
              <div className="card-content">
                <p className="card-label">Appointments</p>
                <h3 className="card-value">{earnings.summary.totalAppointments}</h3>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon info">
                <ChartLine size={24} weight="duotone" />
              </div>
              <div className="card-content">
                <p className="card-label">Average per Appointment</p>
                <h3 className="card-value">{formatCurrency(parseFloat(String(earnings.summary.averagePerAppointment)))}</h3>
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="filter-section">
            <div className="date-range-selector">
              <button className="nav-button" onClick={handlePreviousPeriod}>
                <CaretLeft size={18} />
              </button>

              <div className="date-inputs">
                <div className="date-input-group">
                  <label>From</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className="date-input"
                  />
                </div>

                <div className="date-input-group">
                  <label>To</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className="date-input"
                  />
                </div>
              </div>

              <button className="nav-button" onClick={handleNextPeriod}>
                <CaretRight size={18} />
              </button>
            </div>
          </div>

          {/* Daily Earnings Table */}
          <div className="earnings-table-section">
            <h2 className="section-title">Daily Breakdown</h2>

            {earnings.dailyEarnings.length > 0 ? (
              <div className="earnings-table-wrapper">
                <table className="earnings-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Appointments</th>
                      <th>Earnings</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.dailyEarnings.map((day, index) => (
                      <tr 
                        key={index} 
                        className={selectedDate === day.date ? 'row-selected' : ''}
                        onClick={() => setSelectedDate(selectedDate === day.date ? null : day.date)}
                      >
                        <td className="date-cell">
                          <span className="date-value">{formatDate(day.date)}</span>
                        </td>
                        <td className="center-cell">
                          <span className="badge">{day.appointments}</span>
                        </td>
                        <td className="amount-cell">
                          <span className="amount-value">{formatCurrency(day.earnings)}</span>
                        </td>
                        <td className="action-cell">
                          <button 
                            className="detail-button"
                            onClick={() => setSelectedDate(selectedDate === day.date ? null : day.date)}
                          >
                            <FileText size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <Calendar size={48} />
                <h3>No earnings data available</h3>
                <p>No completed appointments found for the selected date range.</p>
              </div>
            )}
          </div>

          {/* Selected Day Details */}
          {selectedDate && (
            <div className="day-details-section">
              <div className="detail-header">
                <h2>Details for {formatDate(selectedDate)}</h2>
                <button 
                  className="close-button"
                  onClick={() => setSelectedDate(null)}
                >
                  ×
                </button>
              </div>
              
              {earnings.dailyEarnings.find(d => d.date === selectedDate) && (
                <div className="detail-content">
                  <div className="detail-stat">
                    <span className="stat-label">Total Earnings:</span>
                    <span className="stat-value">
                      {formatCurrency(earnings.dailyEarnings.find(d => d.date === selectedDate)?.earnings || 0)}
                    </span>
                  </div>
                  <div className="detail-stat">
                    <span className="stat-label">Number of Appointments:</span>
                    <span className="stat-value">
                      {earnings.dailyEarnings.find(d => d.date === selectedDate)?.appointments}
                    </span>
                  </div>
                  <div className="detail-stat">
                    <span className="stat-label">Appointments IDs:</span>
                    <div className="appointments-list">
                      {earnings.dailyEarnings.find(d => d.date === selectedDate)?.appointmentIds.map((id, idx) => (
                        <span key={idx} className="appointment-id">{id.slice(0, 8)}...</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
