
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicView from './pages/PublicView';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import MemberForm from './components/MemberForm';
import { DataProvider } from './contexts/DataContext';
import AdminLayout from './components/AdminLayout';

const App: React.FC = () => {
  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<PublicView />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin" 
            element={
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/add" 
            element={
              <AdminLayout>
                <MemberForm />
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/edit/:id" 
            element={
              <AdminLayout>
                <MemberForm />
              </AdminLayout>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </DataProvider>
  );
};

export default App;
