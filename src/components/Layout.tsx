import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Users,
  AlertTriangle,
  FolderOpen,
  LayoutDashboard,
  MoveHorizontal,
  Send,
  FileDown,
  Menu,
  X
} from 'lucide-react';
import { MessageStatusMonitor } from './MessageStatusMonitor';
import { WorkflowStatusMonitor } from './WorkflowStatusMonitor';
import { HelpGuide } from './HelpGuide';

const navItems = [
  { path: '/project/manager', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/project/add-task', icon: Plus, label: 'Aufgaben hinzufügen' },
  { path: '/project/overview', icon: ClipboardList, label: 'Aufgabenübersicht' },
  { path: '/project/subcontractors', icon: Users, label: 'Subunternehmer' },
  { path: '/project/report-delay', icon: AlertTriangle, label: 'Verzögerung melden' },
  { path: '/project/shift-task', icon: MoveHorizontal, label: 'Verschiebung einer Aufgabe' },
  { path: '/project/send-message', icon: Send, label: 'Nachricht senden' },
  { path: '/project/export', icon: FileDown, label: 'Exportieren' }
];

export function Layout() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Navigation Bar */}
      <nav className="bg-white shadow-sm lg:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link 
                to="/project-selection" 
                className="text-gray-500 hover:text-gray-700 transition-colors duration-150"
              >
                <FolderOpen className="w-6 h-6" />
              </Link>
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black bg-opacity-25" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-xl">
            <div className="pt-5 pb-6 px-5">
              <div className="flex items-center justify-between">
                <div className="text-lg font-medium text-gray-900">Menu</div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-md p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-6">
                <nav className="grid gap-y-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors duration-150 ${
                        location.pathname === item.path
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link 
                  to="/project-selection" 
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-150"
                >
                  <FolderOpen className="w-6 h-6" />
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-150 ${
                      location.pathname === item.path
                        ? 'text-gray-900 border-b-2 border-gray-500'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <MessageStatusMonitor />
      <WorkflowStatusMonitor />
      <HelpGuide />
    </div>
  );
}
