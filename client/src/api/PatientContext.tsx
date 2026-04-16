import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  getPatientProfile, 
  getMedicalHistory, 
  getPrescriptions, 
  getMyAppointments 
} from '../api/patient';

interface PatientState {
  profile: any | null;
  history: any[];
  prescriptions: any[];
  appointments: any[];
  loading: boolean;
  error: string | null;
}

interface PatientContextType extends PatientState {
  refreshProfile: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  refreshPrescriptions: () => Promise<void>;
  refreshAppointments: () => Promise<void>;
  clearError: () => void;
  setError: (msg: string) => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<PatientState>({
    profile: null,
    history: [],
    prescriptions: [],
    appointments: [],
    loading: false,
    error: null
  });

  const refreshProfile = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const data = await getPatientProfile();
      setState(prev => ({ ...prev, profile: data.data || data, loading: false, error: null }));
    } catch (err: any) {
      console.error('[PatientContext] Failed to fetch profile:', err.message);
      setState(prev => ({ ...prev, profile: null, loading: false, error: `Failed to load profile: ${err.message}` }));
    }
  };

  const refreshHistory = async () => {
    try {
      const data = await getMedicalHistory();
      setState(prev => ({ ...prev, history: data.data || data || [], error: null }));
    } catch (err: any) {
      console.error('[PatientContext] Failed to fetch medical history:', err.message);
      setState(prev => ({ ...prev, history: [] }));
    }
  };

  const refreshPrescriptions = async () => {
    try {
      const data = await getPrescriptions();
      setState(prev => ({ ...prev, prescriptions: data.data || data || [], error: null }));
    } catch (err: any) {
      console.error('[PatientContext] Failed to fetch prescriptions:', err.message);
      setState(prev => ({ ...prev, prescriptions: [] }));
    }
  };

  const refreshAppointments = async () => {
    try {
      console.log('[PatientContext] Fetching appointments...');
      const data = await getMyAppointments();
      setState(prev => ({ ...prev, appointments: data.data || data || [], error: null }));
    } catch (err: any) {
      console.error('[PatientContext] Failed to fetch appointments:', err.message);
      // Don't treat all errors as fatal - set empty appointments and show warning
      setState(prev => ({ 
        ...prev, 
        appointments: [],
        error: `Note: Could not load appointments (${err.message})` 
      }));
    }
  };

  const clearError = () => setState(prev => ({ ...prev, error: null }));
  const setError = (msg: string) => setState(prev => ({ ...prev, error: msg }));

  // Initial data load when token is present
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    // Check if user is actually a patient before fetching
    let user = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      user = null;
    }

    if (token && user?.role === 'patient') {
      refreshProfile();
      refreshHistory();
      refreshPrescriptions();
      refreshAppointments();
    }
  }, []);

  return (
    <PatientContext.Provider value={{ 
      ...state, 
      refreshProfile, 
      refreshHistory, 
      refreshPrescriptions, 
      refreshAppointments,
      clearError,
      setError
    }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
};
