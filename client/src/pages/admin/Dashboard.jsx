import { useState, useEffect } from 'react';
import { FiUsers, FiCalendar, FiUserCheck, FiDollarSign } from 'react-icons/fi';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error:', error);
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
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <FiUsers className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.totalPatients || 0}</p>
            <p className="text-gray-500">Patients</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <FiUserCheck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.totalDoctors || 0}</p>
            <p className="text-gray-500">Doctors</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <FiCalendar className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.totalAppointments || 0}</p>
            <p className="text-gray-500">Appointments</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <FiDollarSign className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">${stats?.totalRevenue || 0}</p>
            <p className="text-gray-500">Revenue</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats?.recentAppointments?.length > 0 ? (
              stats.recentAppointments.slice(0, 5).map((apt, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>{apt.patient?.firstName} → Dr. {apt.doctor?.user?.lastName}</span>
                  <span className={`badge ${
                    apt.status === 'completed' ? 'badge-success' : 'badge-warning'
                  }`}>{apt.status}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent activity</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span>Today's Appointments</span>
              <span className="font-semibold">{stats?.todayAppointments || 0}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span>Pending Verifications</span>
              <span className="font-semibold">{stats?.pendingDoctors || 0}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span>Active Departments</span>
              <span className="font-semibold">{stats?.activeDepartments || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
