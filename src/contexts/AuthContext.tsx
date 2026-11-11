import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, AuthState, RegisterResult } from '../services/auth';
import { UserProfile } from '../types';

interface AuthContextType extends AuthState {
  isLoginTransitioning: boolean;
  setLoginTransitioning: (active: boolean) => void;
  loginWithEmail: (email: string, pass: string) => Promise<UserProfile>;
  registerWithEmail: (name: string, email: string, pass: string, consentGiven?: boolean) => Promise<RegisterResult>;
  loginWithGoogle: (credential: string) => Promise<UserProfile>;
  loginAsGuest: () => Promise<UserProfile>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, captchaToken?: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: (updatedProfile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });
  const [isLoginTransitioning, setLoginTransitioning] = useState<boolean>(false);

  useEffect(() => {
    AuthService.init();
    const unsubscribe = AuthService.subscribe((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    return await AuthService.loginWithEmail(email, pass);
  };

  const registerWithEmail = async (name: string, email: string, pass: string, consentGiven: boolean = true) => {
    return await AuthService.registerWithEmail(name, email, pass, consentGiven);
  };

  const loginWithGoogle = async (credential: string) => {
    return await AuthService.loginWithGoogle(credential);
  };

  const loginAsGuest = async () => {
    return await AuthService.loginAsGuest();
  };

  const resetPassword = async (email: string) => {
    return await AuthService.resetPassword(email);
  };

  const changePassword = async (currentPassword: string, newPassword: string, captchaToken?: string) => {
    return await AuthService.changePassword(currentPassword, newPassword, captchaToken);
  };

  const deleteAccount = async () => {
    return await AuthService.deleteAccount();
  };

  const logout = async () => {
    setLoginTransitioning(false);
    return await AuthService.logout();
  };

  const refreshProfile = (updatedProfile: Partial<UserProfile>) => {
    if (state.user) {
      setState(prev => ({
        ...prev,
        user: { ...prev.user!, ...updatedProfile }
      }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isLoginTransitioning,
        setLoginTransitioning,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsGuest,
        resetPassword,
        changePassword,
        deleteAccount,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
