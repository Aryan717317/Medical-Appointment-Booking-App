import { useState, useEffect } from 'react';
import api from '../../services/api';

const DoctorPatients = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/doctors/my/appointments?status=completed');
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique patients
  const uniquePatients = appointments.reduce((acc, apt) => {
    if (apt.patient && !acc.find(p => p._id === apt.patient._id)) {
      acc.push(apt.patient);
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Patients</h2>

      {uniquePatients.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          No patients yet
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {uniquePatients.map((patient) => (
            <div key={patient._id} className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {patient.firstName?.[0]}{patient.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">
                    {patient.firstName} {patient.lastName}
                  </h3>
                  <p className="text-gray-500 text-sm">{patient.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorPatients;
