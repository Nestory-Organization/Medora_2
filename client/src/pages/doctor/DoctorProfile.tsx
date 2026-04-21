import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Check, Warning } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageTransition from '../../components/PageTransition';
import { useRefreshOnNavigate } from '../../hooks/useRefreshOnNavigate';

interface DoctorProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  specialization: string;
  qualification: string;
  yearsOfExperience: number;
  consultationFee: number;
  bio: string;
  clinicAddress: string;
}

const specializations = [
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Gynecology',
  'General Medicine',
  'Dentistry',
  'ENT',
  'Ophthalmology',
  'Urology'
];

export default function DoctorProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState<DoctorProfileData>({
    firstName: '',
    lastName: '',
    phone: '',
    specialization: '',
    qualification: '',
    yearsOfExperience: 0,
    consultationFee: 0,
    bio: '',
    clinicAddress: ''
  });

  // Refresh profile data when navigating to this page
  useRefreshOnNavigate(fetchProfile);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;

      const response = await axios.get(
        'http://localhost:4000/api/doctors/profile',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success && response.data.data) {
        setFormData(response.data.data);
        setIsEditing(true);
      } else {
        // Pre-fill firstName and lastName from auth user
        if (userData) {
          setFormData(prev => ({
            ...prev,
            firstName: userData.firstName || '',
            lastName: userData.lastName || ''
          }));
        }
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        setMessage({ type: 'error', text: 'Failed to fetch profile' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('experience') || name.includes('Fee') ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.specialization) {
      setMessage({ type: 'error', text: 'First name, last name, and specialization are required' });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      
      const endpoint = isEditing 
        ? 'http://localhost:4000/api/doctors/profile'
        : 'http://localhost:4000/api/doctors/profile';
      
      const method = isEditing ? 'put' : 'post';

      const response = await axios({
        method,
        url: endpoint,
        data: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: isEditing ? 'Profile updated successfully' : 'Profile created successfully' });
        
        // Redirect after success
        setTimeout(() => {
          navigate('/doctor/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to save profile';
      setMessage({ type: 'error', text: errorMsg });
      console.error('Profile submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-400" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-1 bg-blue-500 rounded-full" />
                <span className="text-[9px] font-black text-blue-500 tracking-[0.2em] uppercase italic">
                  Profile Management
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
                {isEditing ? 'Edit Profile' : 'Create Your Profile'}
              </h1>
            </div>
          </div>
        </header>

        {/* Messages */}
        {message && (
          <div className={`p-4 rounded-lg border flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {message.type === 'success' ? (
              <Check size={20} weight="bold" />
            ) : (
              <Warning size={20} weight="bold" />
            )}
            <span className="text-sm font-semibold">{message.text}</span>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Phone and Specialization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">
                    Specialization *
                  </label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all"
                    required
                  >
                    <option value="">Select specialization</option>
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Experience and Fee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">
                    Consultation Fee ($)
                  </label>
                  <input
                    type="number"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all"
                  />
                </div>
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">
                  Qualification/Credentials
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                  placeholder="e.g., MD, MBBS, Board Certified"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">
                  Professional Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Write about your professional background, expertise, and approach to patient care..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all resize-none"
                />
              </div>

              {/* Clinic Address */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">
                  Clinic Address
                </label>
                <textarea
                  name="clinicAddress"
                  value={formData.clinicAddress}
                  onChange={handleInputChange}
                  placeholder="Enter your clinic address..."
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/doctor/dashboard')}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-white transition-colors uppercase tracking-wide"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-white transition-all uppercase tracking-wide flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={18} weight="bold" />
                      {isEditing ? 'Update Profile' : 'Create Profile'}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
