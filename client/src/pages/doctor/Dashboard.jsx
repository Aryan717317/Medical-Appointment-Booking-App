import { useState, useEffect } from 'react';
import { FiCalendar, FiUsers, FiDollarSign, FiStar } from 'react-icons/fi';
import api from '../../services/api';

const DoctorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/doctors/my/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Doctor Dashboard</h2>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <FiCalendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.todayAppointments || 0}</p>
            <p className="text-gray-500">Today</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <FiUsers className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.totalAppointments || 0}</p>
            <p className="text-gray-500">Total Patients</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <FiDollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">${stats?.totalEarnings || 0}</p>
            <p className="text-gray-500">Earnings</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <FiStar className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.rating?.average?.toFixed(1) || 'N/A'}</p>
            <p className="text-gray-500">Rating ({stats?.rating?.count || 0})</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Completed</p>
            <p className="text-2xl font-bold">{stats?.completedAppointments || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Pending</p>
            <p className="text-2xl font-bold">{stats?.pendingAppointments || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Today's Schedule</p>
            <p className="text-2xl font-bold">{stats?.todayAppointments || 0} appointments</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
