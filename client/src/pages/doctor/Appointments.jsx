import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = filter ? `status=${filter}` : '';
      const response = await api.get(`/doctors/my/appointments?${params}`);
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.post(`/appointments/${id}/complete`);
      toast.success('Appointment marked as completed');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Appointments</h2>

      <div className="flex gap-2">
        {['', 'pending', 'confirmed', 'completed'].map((f) => (
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
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div key={apt._id} className="card">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">
                    {apt.patient?.firstName} {apt.patient?.lastName}
                  </h3>
                  <p className="text-gray-500 text-sm">{apt.patient?.email}</p>
                  <p className="text-sm mt-1">
                    {new Date(apt.date).toLocaleDateString()} at {apt.startTime}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${
                    apt.status === 'confirmed' ? 'badge-success' :
                    apt.status === 'completed' ? 'badge-info' : 'badge-warning'
                  }`}>
                    {apt.status}
                  </span>
                  {apt.status === 'confirmed' && (
                    <button
                      onClick={() => handleComplete(apt._id)}
                      className="btn btn-primary text-sm"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
