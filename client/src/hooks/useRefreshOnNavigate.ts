import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook that automatically calls a refresh function when navigation occurs
 * This ensures data is refreshed when switching between tabs/pages
 * 
 * @param refreshFn - The function to call on navigation (e.g., refreshAppointments)
 * @param deps - Additional dependencies to watch
 */
export const useRefreshOnNavigate = (
  refreshFn: () => Promise<void> | void,
  deps: any[] = []
) => {
  const location = useLocation();

  useEffect(() => {
    // Call the refresh function when location changes
    const handleRefresh = async () => {
      try {
        await refreshFn();
      } catch (error) {
        console.error('Error refreshing data on navigation:', error);
      }
    };

    handleRefresh();
  }, [location.pathname, ...deps]);
};

/**
 * Hook for refreshing multiple data sources on navigation
 * 
 * @param refreshFunctions - Array of refresh functions to call
 * @param deps - Additional dependencies to watch
 */
export const useRefreshMultipleOnNavigate = (
  refreshFunctions: Array<() => Promise<void> | void>,
  deps: any[] = []
) => {
  const location = useLocation();

  useEffect(() => {
    const handleRefresh = async () => {
      try {
        await Promise.all(
          refreshFunctions.map(fn => {
            const result = fn();
            return result instanceof Promise ? result : Promise.resolve();
          })
        );
      } catch (error) {
        console.error('Error refreshing data on navigation:', error);
      }
    };

    handleRefresh();
  }, [location.pathname, ...deps]);
};
