import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiStar, FiClock, FiDollarSign, FiAward, FiCalendar, FiVideo } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  const fetchDoctor = async () => {
    try {
      const response = await api.get(`/doctors/${id}`);
      setDoctor(response.data.doctor);
    } catch (error) {
      console.error('Error fetching doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/patient/book/${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Doctor not found</h2>
        <Link to="/doctors" className="text-primary-600 mt-4 inline-block">
          Back to Doctors List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="card">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-32 h-32 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-4xl font-bold text-primary-600">
                  {doctor.user?.firstName?.[0]}{doctor.user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                </h1>
                <p className="text-primary-600 font-medium">{doctor.specialization}</p>
                <p className="text-gray-500">{doctor.department?.name}</p>

                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-1">
                    <FiStar className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="font-semibold">
                      {doctor.rating?.average?.toFixed(1) || 'New'}
                    </span>
                    <span className="text-gray-500">
                      ({doctor.rating?.count || 0} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <FiAward className="w-5 h-5" />
                    <span>{doctor.experience || 0} years experience</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">About</h2>
            <p className="text-gray-600">
              {doctor.bio || 'No bio available.'}
            </p>
          </div>

          {/* Qualifications */}
          {doctor.qualifications?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Qualifications</h2>
              <div className="space-y-3">
                {doctor.qualifications.map((qual, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiAward className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium">{qual.degree}</p>
                      <p className="text-gray-500 text-sm">
                        {qual.institution}, {qual.year}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {doctor.languages?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Languages</h2>
              <div className="flex flex-wrap gap-2">
                {doctor.languages.map((lang, idx) => (
                  <span key={idx} className="badge bg-gray-100 text-gray-700">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Card */}
          <div className="card sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Book Appointment</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FiCalendar className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="font-medium">In-Person Visit</p>
                    <p className="text-sm text-gray-500">At clinic</p>
                  </div>
                </div>
                <p className="font-bold text-primary-600">
                  ${doctor.consultationFee}
                </p>
              </div>

              {doctor.videoConsultationFee && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiVideo className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="font-medium">Video Consultation</p>
                      <p className="text-sm text-gray-500">Online</p>
                    </div>
                  </div>
                  <p className="font-bold text-primary-600">
                    ${doctor.videoConsultationFee}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FiClock className="w-4 h-4" />
                <span>{doctor.slotDuration || 30} min consultation</span>
              </div>

              <button
                onClick={handleBookAppointment}
                disabled={!doctor.isAcceptingAppointments}
                className="w-full btn btn-primary py-3"
              >
                {doctor.isAcceptingAppointments
                  ? 'Book Appointment'
                  : 'Not Accepting Appointments'}
              </button>

              {!isAuthenticated && (
                <p className="text-sm text-gray-500 text-center">
                  Please{' '}
                  <Link to="/login" className="text-primary-600">
                    login
                  </Link>{' '}
                  to book an appointment
                </p>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Working Hours</h2>
            <div className="space-y-2 text-sm">
              {Object.entries(doctor.availability || {}).map(([day, hours]) => (
                <div key={day} className="flex justify-between">
                  <span className="capitalize text-gray-600">{day}</span>
                  <span className={hours.isAvailable ? 'text-gray-900' : 'text-gray-400'}>
                    {hours.isAvailable
                      ? `${hours.start} - ${hours.end}`
                      : 'Closed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
