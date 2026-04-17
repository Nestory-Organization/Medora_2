import { useState, useEffect } from 'react';
import { CaretLeft, CaretRight, ChartLine, Calendar, CurrencyDollar, Users, FileText } from '@phosphor-icons/react';
import './DoctorEarningsAdmin.css';

interface DailyEarning {
  date: string;
  earnings: number;
  appointments: number;
  appointmentIds: string[];
}

interface DoctorEarning {
  doctorId: string;
  summary: {
    totalEarnings: number;
    totalAppointments: number;
    averagePerAppointment: number | string;
  };
  dailyEarnings: DailyEarning[];
}

interface AdminEarningsData {
  period: string;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  totalDoctors: number;
  doctors: DoctorEarning[];
}

export default function DoctorEarningsAdmin() {
  const [earnings, setEarnings] = useState<AdminEarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    fetchEarnings();
  }, [dateRange]);

  const fetchEarnings = async () => {
    if (!token) {
      setError('Admin not authenticated');
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
        `http://localhost:4003/api/payments/earnings/all-doctors?${params.toString()}`,
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

  const getTotalPlatformEarnings = () => {
    if (!earnings) return 0;
    return earnings.doctors.reduce((sum, doctor) => sum + doctor.summary.totalEarnings, 0);
  };

  const getTotalAppointments = () => {
    if (!earnings) return 0;
    return earnings.doctors.reduce((sum, doctor) => sum + doctor.summary.totalAppointments, 0);
  };

  if (loading && !earnings) {
    return (
      <div className="admin-earnings-container">
        <div className="skeleton-loader">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-table"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-earnings-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Platform Earnings</h1>
          <p className="admin-subtitle">Monitor all doctor earnings and transactions</p>
        </div>
        <div className="admin-icon">
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
          <div className="admin-summary-cards">
            <div className="admin-summary-card">
              <div className="card-icon primary">
                <CurrencyDollar size={24} weight="duotone" />
              </div>
              <div className="card-content">
                <p className="card-label">Total Platform Earnings</p>
                <h3 className="card-value">{formatCurrency(getTotalPlatformEarnings())}</h3>
              </div>
            </div>

            <div className="admin-summary-card">
              <div className="card-icon success">
                <Users size={24} weight="duotone" />
              </div>
              <div className="card-content">
                <p className="card-label">Active Doctors</p>
                <h3 className="card-value">{earnings.totalDoctors}</h3>
              </div>
            </div>

            <div className="admin-summary-card">
              <div className="card-icon info">
                <Calendar size={24} weight="duotone" />
              </div>
              <div className="card-content">
                <p className="card-label">Total Appointments</p>
                <h3 className="card-value">{getTotalAppointments()}</h3>
              </div>
            </div>

            <div className="admin-summary-card">
              <div className="card-icon warning">
                <ChartLine size={24} weight="duotone" />
              </div>
              <div className="card-content">
                <p className="card-label">Average per Doctor</p>
                <h3 className="card-value">{formatCurrency(getTotalPlatformEarnings() / (earnings.totalDoctors || 1))}</h3>
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="admin-filter-section">
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

          {/* Doctors List */}
          <div className="doctors-section">
            <h2 className="section-title">Doctor Earnings Report</h2>

            {earnings.doctors.length > 0 ? (
              <div className="doctors-list">
                {earnings.doctors.map((doctor, index) => (
                  <div key={index} className="doctor-card">
                    <div 
                      className={`doctor-header ${selectedDoctor === doctor.doctorId ? 'expanded' : ''}`}
                      onClick={() => setSelectedDoctor(selectedDoctor === doctor.doctorId ? null : doctor.doctorId)}
                    >
                      <div className="doctor-info">
                        <h3 className="doctor-id">Doctor ID: {doctor.doctorId.slice(0, 8)}...</h3>
                        <div className="doctor-stats">
                          <span className="stat">
                            <span className="stat-label">Earnings:</span>
                            <span className="stat-amount">{formatCurrency(doctor.summary.totalEarnings)}</span>
                          </span>
                          <span className="stat">
                            <span className="stat-label">Appointments:</span>
                            <span className="stat-count">{doctor.summary.totalAppointments}</span>
                          </span>
                          <span className="stat">
                            <span className="stat-label">Average:</span>
                            <span className="stat-amount">{formatCurrency(parseFloat(String(doctor.summary.averagePerAppointment)))}</span>
                          </span>
                        </div>
                      </div>
                      <div className={`expand-icon ${selectedDoctor === doctor.doctorId ? 'open' : ''}`}>
                        <FileText size={20} />
                      </div>
                    </div>

                    {selectedDoctor === doctor.doctorId && (
                      <div className="doctor-details">
                        <div className="doctor-daily-earnings">
                          <h4>Daily Breakdown</h4>
                          {doctor.dailyEarnings.length > 0 ? (
                            <div className="daily-table-wrapper">
                              <table className="daily-table">
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>Appointments</th>
                                    <th>Earnings</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {doctor.dailyEarnings.map((day, dayIdx) => (
                                    <tr key={dayIdx}>
                                      <td>{formatDate(day.date)}</td>
                                      <td className="center">
                                        <span className="badge">{day.appointments}</span>
                                      </td>
                                      <td className="amount">{formatCurrency(day.earnings)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="no-data">No daily earnings data available</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Users size={48} />
                <h3>No doctor earnings data</h3>
                <p>No doctors with completed appointments found for the selected date range.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
