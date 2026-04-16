import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DoctorProfile {
  doctorId: string;
  firstName: string;
  lastName: string;
  specialization: string;
  isVerified: boolean;
}

const AdminDashboard: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/admin/doctors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDoctors(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (doctorId: string, status: boolean) => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`http://localhost:4000/api/admin/doctor/${doctorId}/verify`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        fetchDoctors(); // Refresh list
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    navigate('/admin/login');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Admin Management Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2>Doctor Verification Requests</h2>
        {loading ? <p>Loading...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Specialization</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map(doc => (
                <tr key={doc.doctorId} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem' }}>{doc.firstName} {doc.lastName}</td>
                  <td style={{ padding: '1rem' }}>{doc.specialization}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.875rem',
                      backgroundColor: doc.isVerified ? '#d4edda' : '#fff3cd',
                      color: doc.isVerified ? '#155724' : '#856404'
                    }}>
                      {doc.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {!doc.isVerified ? (
                      <button 
                        onClick={() => handleVerify(doc.doctorId, true)}
                        style={{ padding: '0.4rem 0.8rem', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Approve
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleVerify(doc.doctorId, false)}
                        style={{ padding: '0.4rem 0.8rem', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
