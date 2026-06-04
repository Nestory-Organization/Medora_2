import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Envelope, 
  Phone, 
  MapPin, 
  Calendar, 
  GenderIntersex,
  PencilSimple,
  CheckCircle,
  CircleNotch
} from '@phosphor-icons/react';
import { usePatient } from '../../api/PatientContext';
import { updatePatientProfile } from '../../api/patient';
import { useRefreshOnNavigate } from '../../hooks/useRefreshOnNavigate';
import { ProfileSkeleton } from '../../components/Skeleton';
import PageTransition from '../../components/PageTransition';

const InputField = ({ label, name, value, onChange, disabled, icon: Icon, type = "text" }: any) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <div className={`relative flex items-center group transition-all duration-300 ${disabled ? 'opacity-60' : ''}`}>
      <div className="absolute left-4 text-slate-500 transition-colors group-focus-within:text-teal-400">
        <Icon size={20} weight="duotone" />
      </div>
      <input
        type={type}
        name={name}
        id={name}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        placeholder={label}
        className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/5 transition-all"
      />
    </div>
  </div>
);

export default function PatientProfile() {
  const { profile, refreshProfile, setError } = usePatient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Refresh profile data when navigating to this page
  useRefreshOnNavigate(refreshProfile);

  useEffect(() => {
    if (profile) setFormData(profile);
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        age:
          formData.age === '' || formData.age === null || formData.age === undefined
            ? null
            : Number(formData.age),
      };
      await updatePatientProfile(payload);
      await refreshProfile();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile && !formData.email) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto">
          <ProfileSkeleton />
        </div>
      </PageTransition>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="text-slate-500 mt-1">Manage your personal information and health details.</p>
        </div>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
            isEditing 
            ? 'bg-teal-500 hover:bg-teal-400 text-white shadow-teal-500/20' 
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5'
          }`}
        >
          {isSaving ? <CircleNotch className="animate-spin" /> : (isEditing ? <CheckCircle weight="bold" /> : <PencilSimple weight="bold" />)}
          {isEditing ? ' Save Changes' : ' Edit Profile'}
        </button>
      </div>

      <motion.div 
        layout
        className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-4xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <InputField 
            label="First Name" name="firstName" value={formData.firstName} 
            onChange={handleChange} disabled={!isEditing} icon={User} 
          />
          <InputField 
            label="Last Name" name="lastName" value={formData.lastName} 
            onChange={handleChange} disabled={!isEditing} icon={User} 
          />
          <InputField 
            label="Email Address" name="email" value={formData.email} 
            onChange={handleChange} disabled={true} icon={Envelope} type="email"
          />
          <InputField 
            label="Phone Number" name="phone" value={formData.phone} 
            onChange={handleChange} disabled={!isEditing} icon={Phone} 
          />
          <InputField 
            label="Age" name="age" value={formData.age} 
            onChange={handleChange} disabled={!isEditing} icon={Calendar} type="number"
          />
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Gender</label>
            <div className={`relative flex items-center ${!isEditing ? 'opacity-60' : ''}`}>
              <div className="absolute left-4 text-slate-500"><GenderIntersex size={20} weight="duotone" /></div>
              <select
                name="gender"
                title="Select Gender"
                value={formData.gender || ''}
                onChange={(e: any) => handleChange(e)}
                disabled={!isEditing}
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-slate-100 appearance-none focus:outline-none focus:border-teal-500/50 px-5"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="md:col-span-2">
            <InputField 
              label="Home Address" name="address" value={formData.address} 
              onChange={handleChange} disabled={!isEditing} icon={MapPin} 
            />
          </div>
        </div>

        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex justify-end gap-4"
          >
            <button 
              onClick={() => { setIsEditing(false); setFormData(profile); }}
              className="px-6 py-3 rounded-xl font-bold bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
