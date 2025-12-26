
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AUTH_KEY = 'family_tree_auth';

const AdminLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem(AUTH_KEY);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminLayout;
