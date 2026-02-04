import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiVideo, FiMapPin, FiX, FiStar } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [cancelModal, setCancelModal] = useState(null);
  const [ratingModal, setRatingModal] = useState(null);
  const [rating, setRating] = useState({ score: 5, review: '' });

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = filter === 'upcoming' 
        ? 'upcoming=true' 
        : filter === 'all' 
          ? '' 
          : `status=${filter}`;
      const response = await api.get(`/appointments/my?${params}`);
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id, reason) => {
    try {
      await api.post(`/appointments/${id}/cancel`, { reason });
      toast.success('Appointment cancelled');
      setCancelModal(null);
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleRate = async (id) => {
    try {
      await api.post(`/appointments/${id}/rate`, rating);
      toast.success('Thank you for your feedback!');
      setRatingModal(null);
      setRating({ score: 5, review: '' });
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'badge-warning',
      confirmed: 'badge-success',
      completed: 'badge-info',
      cancelled: 'badge-danger',
      'in-progress': 'bg-purple-100 text-purple-800'
    };
    return styles[status] || 'badge-info';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Appointments</h2>
        <Link to="/doctors" className="btn btn-primary">
          Book New
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['upcoming', 'completed', 'cancelled', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg capitalize transition ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="card text-center py-12">
          <FiCalendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div key={apt._id} className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-600">
                      {apt.doctor?.user?.firstName?.[0]}
                      {apt.doctor?.user?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                    </h3>
                    <p className="text-gray-500 text-sm">{apt.doctor?.specialization}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FiCalendar className="w-4 h-4" />
                        {new Date(apt.date).toLocaleDateString()}
                      </span>
                      <span>{apt.startTime} - {apt.endTime}</span>
                      <span className="flex items-center gap-1">
                        {apt.type === 'video' ? (
                          <><FiVideo className="w-4 h-4" /> Video</>
                        ) : (
                          <><FiMapPin className="w-4 h-4" /> In-Person</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`badge ${getStatusBadge(apt.status)}`}>
                    {apt.status}
                  </span>
                  
                  {apt.status === 'confirmed' && apt.type === 'video' && (
                    <button className="btn btn-primary text-sm">
                      Join Call
                    </button>
                  )}

                  {['pending', 'confirmed'].includes(apt.status) && (
                    <button
                      onClick={() => setCancelModal(apt)}
                      className="btn btn-danger text-sm"
                    >
                      Cancel
                    </button>
                  )}

                  {apt.status === 'completed' && !apt.rating?.score && (
                    <button
                      onClick={() => setRatingModal(apt)}
                      className="btn btn-secondary text-sm flex items-center gap-1"
                    >
                      <FiStar /> Rate
                    </button>
                  )}
                </div>
              </div>

              {apt.rating?.score && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Your rating:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        className={`w-4 h-4 ${
                          star <= apt.rating.score
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {apt.rating.review && (
                    <p className="text-sm text-gray-600 mt-1">{apt.rating.review}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Cancel Appointment</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel your appointment with Dr.{' '}
              {cancelModal.doctor?.user?.firstName} {cancelModal.doctor?.user?.lastName}?
            </p>
            <textarea
              className="input mb-4"
              placeholder="Reason for cancellation (optional)"
              rows={3}
              id="cancelReason"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setCancelModal(null)}
                className="btn btn-secondary flex-1"
              >
                Keep Appointment
              </button>
              <button
                onClick={() => handleCancel(
                  cancelModal._id,
                  document.getElementById('cancelReason').value
                )}
                className="btn btn-danger flex-1"
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Rate Your Experience</h3>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating({ ...rating, score: star })}
                >
                  <FiStar
                    className={`w-8 h-8 ${
                      star <= rating.score
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              className="input mb-4"
              placeholder="Write a review (optional)"
              rows={3}
              value={rating.review}
              onChange={(e) => setRating({ ...rating, review: e.target.value })}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRatingModal(null)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRate(ratingModal._id)}
                className="btn btn-primary flex-1"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
