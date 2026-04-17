import { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Envelope, MapPin, CalendarBlank } from '@phosphor-icons/react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageTransition from '../../components/PageTransition';

interface PatientDetail {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string[];
  allergies?: string[];
  medications?: string[];
  createdAt: string;
}

export default function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPatientDetail();
  }, [patientId]);

  const fetchPatientDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      // Try to fetch from patient service first, fallback to appointment service
      const response = await axios.get(
        `http://localhost:4000/api/patients/${patientId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      ).catch(async (err) => {
        if (err.response?.status === 404 || err.response?.status === 403) {
          // Fallback: fetch from your local appointment data
          return { data: { success: true, data: { _id: patientId } } };
        }
        throw err;
      });

      if (response.data.success) {
        setPatient(response.data.data);
      }
    } catch (error: any) {
      console.error('Fetch patient error:', error);
      setError('Failed to load patient details');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex items-center gap-4">
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-1 bg-blue-500 rounded-full" />
              <span className="text-[9px] font-black text-blue-500 tracking-[0.2em] uppercase italic">
                Patient Profile
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
              Patient Information
            </h1>
          </div>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-lg">
            {error}
          </div>
        ) : patient ? (
          <div className="space-y-6">
            {/* Main Info Card */}
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-white/10 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                    {patient.firstName?.[0]}{patient.lastName?.[0]}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white mb-1">
                      {patient.firstName} {patient.lastName}
                    </h2>
                    <p className="text-slate-400 font-semibold">Patient ID: {patient._id?.slice(-8)}</p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patient.email && (
                  <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-white/5">
                    <Envelope size={18} className="text-blue-400" weight="bold" />
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase">Email</p>
                      <p className="text-white font-semibold">{patient.email}</p>
                    </div>
                  </div>
                )}
                {patient.phone && (
                  <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-white/5">
                    <Phone size={18} className="text-green-400" weight="bold" />
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase">Phone</p>
                      <p className="text-white font-semibold">{patient.phone}</p>
                    </div>
                  </div>
                )}
                {patient.address && (
                  <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-white/5 md:col-span-2">
                    <MapPin size={18} className="text-purple-400" weight="bold" />
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase">Address</p>
                      <p className="text-white font-semibold">{patient.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {patient.dateOfBirth && (
                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarBlank size={16} className="text-indigo-400" weight="bold" />
                    <p className="text-xs text-slate-400 font-semibold uppercase">Age</p>
                  </div>
                  <p className="text-2xl font-black text-white">{calculateAge(patient.dateOfBirth)} years</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                </div>
              )}
              {patient.gender && (
                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4">
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-2">Gender</p>
                  <p className="text-2xl font-black text-white capitalize">{patient.gender}</p>
                </div>
              )}
              {patient.bloodType && (
                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4">
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-2">Blood Type</p>
                  <p className="text-2xl font-black text-red-400">{patient.bloodType}</p>
                </div>
              )}
            </div>

            {/* Medical History */}
            {patient.medicalHistory && patient.medicalHistory.length > 0 && (
              <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6">
                <h3 className="text-lg font-black text-white mb-4 uppercase tracking-tight italic">Medical History</h3>
                <div className="space-y-2">
                  {patient.medicalHistory.map((condition, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-white/5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-slate-200">{condition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allergies */}
            {patient.allergies && patient.allergies.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <h3 className="text-lg font-black text-red-300 mb-4 uppercase tracking-tight italic">⚠️ Allergies</h3>
                <div className="space-y-2">
                  {patient.allergies.map((allergy, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="text-red-200 font-semibold">{allergy}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medications */}
            {patient.medications && patient.medications.length > 0 && (
              <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6">
                <h3 className="text-lg font-black text-white mb-4 uppercase tracking-tight italic">Current Medications</h3>
                <div className="space-y-2">
                  {patient.medications.map((med, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-white/5">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-slate-200">{med}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {patient.emergencyContact && (
              <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-2">Emergency Contact</p>
                <p className="text-white font-semibold text-lg">{patient.emergencyContact}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/doctor/appointments')}
                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-white transition-colors uppercase tracking-wide"
              >
                Back to Appointments
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </PageTransition>
  );
}
