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
      setState(prev => ({ ...prev, profile: data.data || data, loading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message || 'Failed to fetch profile', loading: false }));
    }
  };

  const refreshHistory = async () => {
    try {
      const data = await getMedicalHistory();
      setState(prev => ({ ...prev, history: data.data || data }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message || 'Failed to fetch medical history' }));
    }
  };

  const refreshPrescriptions = async () => {
    try {
      const data = await getPrescriptions();
      setState(prev => ({ ...prev, prescriptions: data.data || data }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message || 'Failed to fetch prescriptions' }));
    }
  };

  const refreshAppointments = async () => {
    try {
      const data = await getMyAppointments();
      setState(prev => ({ ...prev, appointments: data.data || data }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message || 'Failed to fetch appointments' }));
    }
  };

  const clearError = () => setState(prev => ({ ...prev, error: null }));
  const setError = (msg: string) => setState(prev => ({ ...prev, error: msg }));

  // Initial data load when token is present
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    // Check for either the object format or just having a token
    if (token) {
      if (!userStr) {
        console.warn("PatientContext: authToken found but no 'user' object in localStorage");
      }
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
