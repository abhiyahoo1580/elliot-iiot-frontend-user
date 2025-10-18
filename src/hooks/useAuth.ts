import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Custom hook to access the AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  // Ensure hook is used within a valid AuthProvider
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
