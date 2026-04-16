import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  getPatientProfile, 
  registerPatientProfile,
  getMedicalHistory, 
  getMedicalDocuments,
  getPrescriptions, 
  getMyAppointments,
  getStoredUser,
  getUserId,
} from '../api/patient';

interface PatientState {
  profile: any | null;
  history: any[];
  documents: any[];
  prescriptions: any[];
  appointments: any[];
  loading: boolean;
  error: string | null;
}

interface PatientContextType extends PatientState {
  refreshProfile: () => Promise<any>;
  refreshHistory: () => Promise<void>;
  refreshPrescriptions: () => Promise<void>;
  refreshDocuments: () => Promise<void>;
  refreshAppointments: () => Promise<void>;
  clearError: () => void;
  setError: (msg: string) => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<PatientState>({
    profile: null,
    history: [],
    documents: [],
    prescriptions: [],
    appointments: [],
    loading: false,
    error: null
  });

  const refreshProfile = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const data = await getPatientProfile();
      setState(prev => ({ ...prev, profile: data, loading: false, error: null }));
      return data;
    } catch (err: any) {
      const status = err?.response?.status;

      // Bootstrap profile for patient accounts that do not yet have a patient-service record
      if (status === 404) {
        try {
          const user = getStoredUser();
          const userId = getUserId(user);

          if (userId) {
            try {
              await registerPatientProfile({
                userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
              });
            } catch (registerErr: any) {
              if (registerErr?.response?.status !== 409) {
                throw registerErr;
              }
            }

            const createdProfile = await getPatientProfile();
            setState(prev => ({ ...prev, profile: createdProfile, loading: false, error: null }));
            return createdProfile;
          }
        } catch (bootstrapErr: any) {
          console.error('[PatientContext] Failed to bootstrap profile:', bootstrapErr.message);
        }
      }

      console.error('[PatientContext] Failed to fetch profile:', err.message);
      setState(prev => ({ ...prev, profile: null, loading: false, error: `Failed to load profile: ${err.message}` }));
      return null;
    }
  };

  const refreshHistory = async () => {
    try {
      const data = await getMedicalHistory();
      setState(prev => ({ ...prev, history: data || [], error: null }));
    } catch (err: any) {
      console.error('[PatientContext] Failed to fetch medical history:', err.message);
      setState(prev => ({ ...prev, history: [] }));
    }
  };

  const refreshDocuments = async () => {
    try {
      const data = await getMedicalDocuments();
      setState(prev => ({ ...prev, documents: data || [], error: null }));
    } catch (err: any) {
      console.error('[PatientContext] Failed to fetch documents:', err.message);
      setState(prev => ({ ...prev, documents: [] }));
    }
  };

  const refreshPrescriptions = async () => {
    try {
      const data = await getPrescriptions();
      setState(prev => ({ ...prev, prescriptions: data || [], error: null }));
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
    const user = getStoredUser();
    
    // Check if user is actually a patient before fetching
    if (token && user?.role === 'patient') {
      const loadPatientData = async () => {
        await refreshProfile();
        await Promise.all([
          refreshHistory(),
          refreshDocuments(),
          refreshPrescriptions(),
          refreshAppointments(),
        ]);
      };

      loadPatientData();
    }
  }, []);

  return (
    <PatientContext.Provider value={{ 
      ...state, 
      refreshProfile, 
      refreshHistory, 
      refreshPrescriptions, 
      refreshDocuments,
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
