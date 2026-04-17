import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash, Check, Warning } from '@phosphor-icons/react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageTransition from '../../components/PageTransition';

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface Prescription {
  _id: string;
  appointmentId: string;
  medicines: Medicine[];
  notes?: string;
  createdAt: string;
}

export default function PrescriptionManagement() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchPrescription();
  }, [appointmentId]);

  const fetchPrescription = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `http://localhost:4000/api/doctors/appointment/${appointmentId}/prescription`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success && response.data.data) {
        const payload = response.data.data;
        const prescriptionData = payload?.prescription || payload;
        const fetchedMedicines = Array.isArray(prescriptionData?.medicines)
          ? prescriptionData.medicines
          : [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }];

        setPrescription({
          _id: payload?.appointmentId || appointmentId || '',
          appointmentId: payload?.appointmentId || appointmentId || '',
          medicines: fetchedMedicines,
          notes: prescriptionData?.notes || '',
          createdAt: prescriptionData?.prescribedAt || new Date().toISOString()
        });
        setMedicines(fetchedMedicines);
        setNotes(prescriptionData?.notes || '');
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Fetch prescription error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: keyof Medicine, value: string) => {
    const newMedicines = [...medicines];
    newMedicines[index][field] = value;
    setMedicines(newMedicines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const validMedicines = medicines.filter(m => m.name && m.dosage && m.frequency && m.duration);
    if (validMedicines.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one medicine with all required fields' });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = `http://localhost:4000/api/doctors/appointment/${appointmentId}/prescription`;

      const response = await axios({
        method: 'post',
        url: endpoint,
        data: {
          medicines: validMedicines,
          notes: notes || null
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Prescription added successfully' });
        const savedMedicines = Array.isArray(response.data.data?.medicines)
          ? response.data.data.medicines
          : validMedicines;
        setPrescription({
          _id: response.data.data?.prescriptionId || appointmentId || '',
          appointmentId: response.data.data?.appointmentId || appointmentId || '',
          medicines: savedMedicines,
          notes: response.data.data?.notes || notes || '',
          createdAt: new Date().toISOString()
        });
        setMedicines(savedMedicines);
        setTimeout(() => {
          navigate('/doctor/appointments');
        }, 2000);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to save prescription';
      setMessage({ type: 'error', text: errorMsg });
      console.error('Prescription submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const commonMedicines = [
    'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Aspirin', 'Cetirizine',
    'Omeprazole', 'Metformin', 'Lisinopril', 'Atorvastatin', 'Vitamin D'
  ];

  const commonFrequencies = [
    'Once daily', 'Twice daily', 'Thrice daily', 'Every 4 hours', 'Every 6 hours',
    'Every 8 hours', 'Every 12 hours', 'Once at bedtime', 'Twice daily with meals'
  ];

  const commonDurations = [
    '3 days', '5 days', '7 days', '10 days', '14 days', '21 days', '30 days', '60 days'
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex items-center gap-4">
          <button
            onClick={() => navigate('/doctor/appointments')}
            title="Go back to appointments"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-1 bg-green-500 rounded-full" />
              <span className="text-[9px] font-black text-green-500 tracking-[0.2em] uppercase italic">
                Medication
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
              Prescription Management
            </h1>
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

        {!prescription && !loading && (
          <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/5 text-blue-300 flex items-start gap-3">
            <div className="mt-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Creating New Prescription</p>
              <p className="text-xs mt-1">No existing prescription found. Fill in the form below to create a new one.</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Medicines Section */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Medicines</h2>

              <div className="space-y-4">
                {medicines.map((medicine, index) => (
                  <div key={index} className="bg-slate-800/50 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-400 uppercase">Medicine {index + 1}</span>
                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(index)}
                          title={`Remove medicine ${index + 1}`}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        >
                          <Trash size={16} weight="bold" />
                        </button>
                      )}
                    </div>

                    {/* Medicine Name */}
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Medicine Name *</label>
                      <div className="relative">
                        <input
                          type="text"
                          list={`medicines-${index}`}
                          value={medicine.name}
                          onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                          placeholder="Select or type medicine name"
                          className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50 transition-all"
                          required
                        />
                        <datalist id={`medicines-${index}`}>
                          {commonMedicines.map(med => (
                            <option key={med} value={med} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* Dosage, Frequency, Duration Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Dosage *</label>
                        <input
                          type="text"
                          value={medicine.dosage}
                          onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                          placeholder="e.g., 500mg"
                          className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Frequency *</label>
                        <select
                          value={medicine.frequency}
                          onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                          title="Medicine frequency"
                          className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500/50 transition-all"
                          required
                        >
                          <option value="">Select frequency</option>
                          {commonFrequencies.map(freq => (
                            <option key={freq} value={freq}>{freq}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Duration *</label>
                        <select
                          value={medicine.duration}
                          onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                          title="Medicine duration"
                          className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500/50 transition-all"
                          required
                        >
                          <option value="">Select duration</option>
                          {commonDurations.map(dur => (
                            <option key={dur} value={dur}>{dur}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Special Instructions</label>
                      <input
                        type="text"
                        value={medicine.instructions || ''}
                        onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                        placeholder="e.g., Take with food, avoid dairy"
                        className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Medicine Button */}
              <button
                type="button"
                onClick={handleAddMedicine}
                className="w-full px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                <Plus size={18} weight="bold" />
                Add Another Medicine
              </button>
            </div>

            {/* Notes Section */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight mb-4">Additional Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special instructions, warnings, or notes about the prescription..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50 transition-all resize-none"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/doctor/appointments')}
                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-white transition-colors uppercase tracking-wide"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-linear-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-white transition-all uppercase tracking-wide flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={18} weight="bold" />
                    {prescription ? 'Update Prescription' : 'Add Prescription'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </PageTransition>
  );
}
