import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import {
  FiHome, FiCalendar, FiClock, FiUsers, FiFileText,
  FiSettings, FiMenu, FiX, FiLogOut, FiUser, FiPieChart,
  FiGrid, FiBriefcase
} from 'react-icons/fi';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getNavItems = () => {
    const baseUrl = `/${user.role}`;
    
    switch (user.role) {
      case 'admin':
        return [
          { path: baseUrl, icon: FiHome, label: 'Dashboard' },
          { path: `${baseUrl}/doctors`, icon: FiBriefcase, label: 'Doctors' },
          { path: `${baseUrl}/patients`, icon: FiUsers, label: 'Patients' },
          { path: `${baseUrl}/appointments`, icon: FiCalendar, label: 'Appointments' },
          { path: `${baseUrl}/departments`, icon: FiGrid, label: 'Departments' },
          { path: `${baseUrl}/reports`, icon: FiPieChart, label: 'Reports' }
        ];
      case 'doctor':
        return [
          { path: baseUrl, icon: FiHome, label: 'Dashboard' },
          { path: `${baseUrl}/appointments`, icon: FiCalendar, label: 'Appointments' },
          { path: `${baseUrl}/slots`, icon: FiClock, label: 'Manage Slots' },
          { path: `${baseUrl}/patients`, icon: FiUsers, label: 'My Patients' },
          { path: `${baseUrl}/profile`, icon: FiSettings, label: 'Profile Settings' }
        ];
      default: // patient
        return [
          { path: baseUrl, icon: FiHome, label: 'Dashboard' },
          { path: `${baseUrl}/appointments`, icon: FiCalendar, label: 'My Appointments' },
          { path: `${baseUrl}/prescriptions`, icon: FiFileText, label: 'Prescriptions' },
          { path: `${baseUrl}/profile`, icon: FiUser, label: 'Profile' }
        ];
    }
  };

  const navItems = getNavItems();

  const isActive = (path) => {
    if (path === `/${user.role}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-gray-900">MedBook</span>
            </Link>
            <button
              className="lg:hidden p-1"
              onClick={() => setSidebarOpen(false)}
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition w-full px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm h-16 flex items-center px-4 lg:px-8 sticky top-0 z-30">
          <button
            className="lg:hidden p-2 -ml-2 mr-2"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {navItems.find(item => isActive(item.path))?.label || 'Dashboard'}
          </h1>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
