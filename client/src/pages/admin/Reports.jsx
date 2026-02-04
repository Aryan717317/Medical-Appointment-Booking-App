import { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import api from '../../services/api';

const AdminReports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/reports?start=${dateRange.start}&end=${dateRange.end}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!stats) return;
    
    const data = [
      ['Metric', 'Value'],
      ['Total Appointments', stats.totalAppointments],
      ['Completed', stats.completedAppointments],
      ['Cancelled', stats.cancelledAppointments],
      ['Total Revenue', `$${stats.totalRevenue}`],
      ['New Patients', stats.newPatients],
      ['New Doctors', stats.newDoctors]
    ];

    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reports</h2>
        <button
          onClick={exportCSV}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiDownload /> Export CSV
        </button>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Date Range</h3>
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="input"
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card text-center">
          <p className="text-4xl font-bold text-primary-600">
            {stats?.totalAppointments || 0}
          </p>
          <p className="text-gray-500 mt-2">Total Appointments</p>
        </div>
        <div className="card text-center">
          <p className="text-4xl font-bold text-green-600">
            {stats?.completedAppointments || 0}
          </p>
          <p className="text-gray-500 mt-2">Completed</p>
        </div>
        <div className="card text-center">
          <p className="text-4xl font-bold text-red-600">
            {stats?.cancelledAppointments || 0}
          </p>
          <p className="text-gray-500 mt-2">Cancelled</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Revenue Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span>Total Revenue</span>
              <span className="font-bold text-green-600">${stats?.totalRevenue || 0}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span>Average per Appointment</span>
              <span className="font-semibold">
                ${stats?.completedAppointments > 0 
                  ? (stats.totalRevenue / stats.completedAppointments).toFixed(2)
                  : 0}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">User Growth</h3>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span>New Patients</span>
              <span className="font-semibold">{stats?.newPatients || 0}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span>New Doctors</span>
              <span className="font-semibold">{stats?.newDoctors || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Appointment Breakdown by Type</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats?.inPersonAppointments || 0}</p>
            <p className="text-gray-600">In-Person Consultations</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{stats?.videoAppointments || 0}</p>
            <p className="text-gray-600">Video Consultations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
