import { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const response = await api.get(`/admin/appointments${params}`);
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">All Appointments</h2>

      <div className="flex gap-2">
        {['', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg capitalize ${
              filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100'
            }`}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Patient</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Doctor</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Date & Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {appointments.map((apt) => (
                <tr key={apt._id}>
                  <td className="px-4 py-3">
                    {apt.patient?.firstName} {apt.patient?.lastName}
                  </td>
                  <td className="px-4 py-3">
                    Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(apt.date).toLocaleDateString()} at {apt.startTime}
                  </td>
                  <td className="px-4 py-3 capitalize">{apt.type}</td>
                  <td className="px-4 py-3">${apt.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      apt.status === 'completed' ? 'badge-success' :
                      apt.status === 'cancelled' ? 'badge-error' :
                      apt.status === 'confirmed' ? 'badge-info' : 'badge-warning'
                    }`}>
                      {apt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;
