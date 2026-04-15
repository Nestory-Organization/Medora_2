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
  CheckCircle
} from '@phosphor-icons/react';
import { getPatientProfile, updatePatientProfile } from '../../api/patient';

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
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={label}
        className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/5 transition-all"
      />
    </div>
  </div>
);

export default function PatientProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getPatientProfile();
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await updatePatientProfile(profile);
      setIsEditing(false);
      // Optional: show toast
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="text-slate-500 mt-1">Manage your personal information and health details.</p>
        </div>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
            isEditing 
            ? 'bg-teal-500 hover:bg-teal-400 text-white shadow-teal-500/20' 
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5'
          }`}
        >
          {isEditing ? <><CheckCircle weight="bold" /> Save Changes</> : <><PencilSimple weight="bold" /> Edit Profile</>}
        </button>
      </div>

      <motion.div 
        layout
        className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-4xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <InputField 
            label="First Name" name="firstName" value={profile.firstName} 
            onChange={handleChange} disabled={!isEditing} icon={User} 
          />
          <InputField 
            label="Last Name" name="lastName" value={profile.lastName} 
            onChange={handleChange} disabled={!isEditing} icon={User} 
          />
          <InputField 
            label="Email Address" name="email" value={profile.email} 
            onChange={handleChange} disabled={!isEditing} icon={Envelope} type="email"
          />
          <InputField 
            label="Phone Number" name="phone" value={profile.phone} 
            onChange={handleChange} disabled={!isEditing} icon={Phone} 
          />
          <InputField 
            label="Age" name="age" value={profile.age} 
            onChange={handleChange} disabled={!isEditing} icon={Calendar} type="number"
          />
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Gender</label>
            <div className={`relative flex items-center ${!isEditing ? 'opacity-60' : ''}`}>
              <div className="absolute left-4 text-slate-500"><GenderIntersex size={20} weight="duotone" /></div>
              <select
                name="gender"
                title="Select Gender"
                value={profile.gender}
                onChange={(e: any) => handleChange(e)}
                disabled={!isEditing}
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-slate-100 appearance-none focus:outline-none focus:border-teal-500/50"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="md:col-span-2">
            <InputField 
              label="Home Address" name="address" value={profile.address} 
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
              onClick={() => setIsEditing(false)}
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
