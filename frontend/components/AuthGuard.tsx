/**
 * @file AuthGuard.tsx
 * @description Authentication guard component that wraps the app and handles authentication state
 */

import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import AuthModal from './AuthModal';

interface AuthGuardProps {
  children: React.ReactNode;
  onAuthSuccess?: () => void;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, onAuthSuccess }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (!authenticated) {
        setShowAuthModal(true);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    // Notify parent component that authentication was successful
    if (onAuthSuccess) {
      onAuthSuccess();
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setShowAuthModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              SFL Prompt Studio
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please sign in to access the application
            </p>
          </div>
        </div>
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {}} // Don't allow closing when not authenticated
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <div className="relative">
      {/* Logout button in top right */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
      
      {children}
    </div>
  );
};

export default AuthGuard;