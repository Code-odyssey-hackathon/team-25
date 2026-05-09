/**
 * JanaVaani — Auth Context
 * Provides auth state (user + authority/engineer profile) to the React component tree.
 */
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentAuthority, getCurrentEngineer, onAuthStateChange } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authority, setAuthority] = useState(null);
  const [engineer, setEngineer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  
  // Prevent multiple simultaneous profile fetches
  const fetchInProgress = useRef(false);

  const fetchProfile = useCallback(async (currUser) => {
    if (!currUser || fetchInProgress.current) return;
    
    fetchInProgress.current = true;
    try {
      // Try to fetch authority profile first
      const auth = await getCurrentAuthority(currUser);
      if (auth) {
        setAuthority(auth);
        setEngineer(null);
      } else {
        // Not an authority, check if engineer
        const eng = await getCurrentEngineer(currUser);
        setEngineer(eng);
        setAuthority(null);
      }
    } catch (err) {
      // Handle lock contention gracefully
      if (err?.message?.includes('Lock')) {
        console.warn('Auth profile fetch deferred due to lock contention');
      } else {
        console.error('Profile fetch error:', err);
      }
    } finally {
      fetchInProgress.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Listen for auth state changes (including initial session)
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      const currUser = session?.user ?? null;
      
      setUser(currUser);
      setEmailConfirmed(!!currUser?.email_confirmed_at);

      if (currUser) {
        await fetchProfile(currUser);
      } else {
        setAuthority(null);
        setEngineer(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      authority, 
      engineer,
      loading, 
      isAdmin: !!authority,
      isEngineer: !!engineer,
      isVerified: !!user && emailConfirmed,
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}