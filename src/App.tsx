import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProjectSelection } from './pages/ProjectSelection';
import { ProjectManager } from './pages/ProjectManager';
import { AddTask } from './pages/AddTask';
import { TaskOverview } from './pages/TaskOverview';
import { ManageSubcontractors } from './pages/ManageSubcontractors';
import { ReportDelay } from './pages/ReportDelay';
import { ShiftTask } from './pages/ShiftTask';
import { SendMessage } from './pages/SendMessage';
import { ProjectExport } from './pages/ProjectExport';
import { Login } from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/project-selection" element={
            <PrivateRoute>
              <ProjectSelection />
            </PrivateRoute>
          } />
          
          <Route path="/project" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route path="manager" element={<ProjectManager />} />
            <Route path="add-task" element={<AddTask />} />
            <Route path="overview" element={<TaskOverview />} />
            <Route path="subcontractors" element={<ManageSubcontractors />} />
            <Route path="report-delay" element={<ReportDelay />} />
            <Route path="shift-task" element={<ShiftTask />} />
            <Route path="send-message" element={<SendMessage />} />
            <Route path="export" element={<ProjectExport />} />
            <Route index element={<Navigate to="manager" replace />} />
          </Route>
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
