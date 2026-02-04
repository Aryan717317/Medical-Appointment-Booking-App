import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiClock, FiFileText, FiPlus } from 'react-icons/fi';
import api from '../../services/api';

const PatientDashboard = () => {
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    prescriptions: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, prescriptionsRes] = await Promise.all([
        api.get('/appointments/my?upcoming=true&limit=5'),
        api.get('/prescriptions/my?limit=1')
      ]);

      const upcoming = appointmentsRes.data.appointments || [];
      setUpcomingAppointments(upcoming);
      
      setStats({
        upcoming: upcoming.length,
        completed: 0,
        prescriptions: prescriptionsRes.data.pagination?.total || 0
      });

      // Get completed count
      const completedRes = await api.get('/appointments/my?status=completed&limit=1');
      setStats(s => ({ ...s, completed: completedRes.data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Error fetching data:', error);
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
      {/* Quick Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Welcome Back!</h2>
        <Link to="/doctors" className="btn btn-primary flex items-center gap-2">
          <FiPlus /> Book Appointment
        </Link>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <FiCalendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.upcoming}</p>
            <p className="text-gray-500">Upcoming</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <FiClock className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-gray-500">Completed</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <FiFileText className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.prescriptions}</p>
            <p className="text-gray-500">Prescriptions</p>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Upcoming Appointments</h3>
          <Link to="/patient/appointments" className="text-primary-600 text-sm hover:underline">
            View All
          </Link>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiCalendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming appointments</p>
            <Link to="/doctors" className="text-primary-600 hover:underline">
              Book your first appointment
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {apt.doctor?.user?.firstName?.[0]}
                      {apt.doctor?.user?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {apt.doctor?.specialization}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {new Date(apt.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">{apt.startTime}</p>
                </div>
                <span className={`badge ${
                  apt.status === 'confirmed' ? 'badge-success' :
                  apt.status === 'pending' ? 'badge-warning' : 'badge-info'
                }`}>
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
