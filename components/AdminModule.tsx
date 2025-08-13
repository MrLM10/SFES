import React, { useState } from 'react';
import { AdminLoginForm } from './admin/AdminLoginForm';
import { AdminDashboard } from './admin/AdminDashboard';

interface AdminModuleProps {
  onBack: () => void;
}

interface AdminUser {
  id: string;
  email: string;
  role: 'admin_general' | 'admin_comum';
  name?: string;
  country?: string;
  storeId?: string;
  isActive: boolean;
  createdAt: string;
}

export function AdminModule({ onBack }: AdminModuleProps) {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (user: AdminUser) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  if (!isLoggedIn || !currentUser) {
    return (
      <AdminLoginForm 
        onLogin={handleLogin}
        onBack={onBack}
      />
    );
  }

  return (
    <AdminDashboard 
      currentUser={currentUser}
      onLogout={handleLogout}
      onBack={onBack}
    />
  );
}