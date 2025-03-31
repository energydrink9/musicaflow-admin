import { useAuth0 } from '@auth0/auth0-react';
import { createAxiosInstance } from '../providers/axios-instance';

/**
 * Custom hook to get an axios instance with authentication
 * This allows making authenticated API calls outside of refine hooks
 */
export const useAxiosInstance = () => {
  const { getAccessTokenSilently } = useAuth0();
  
  // Reuse the existing axios instance creator
  return createAxiosInstance(getAccessTokenSilently);
};
