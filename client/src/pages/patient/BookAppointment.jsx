import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiVideo, FiMapPin, FiCheck } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointmentType, setAppointmentType] = useState('in-person');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchDoctor();
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots();
    }
  }, [selectedDate]);

  const fetchDoctor = async () => {
    try {
      const response = await api.get(`/doctors/${doctorId}`);
      setDoctor(response.data.doctor);
    } catch (error) {
      console.error('Error fetching doctor:', error);
      toast.error('Doctor not found');
      navigate('/doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const response = await api.get(`/slots/doctor/${doctorId}?date=${selectedDate}`);
      setSlots(response.data.slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const handleBook = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    setBooking(true);
    try {
      const response = await api.post('/appointments', {
        doctorId,
        slotId: selectedSlot._id,
        date: selectedDate,
        type: appointmentType,
        reason
      });

      // For demo, simulate payment confirmation
      await api.post(`/appointments/${response.data.appointment._id}/confirm-payment`);
      
      toast.success('Appointment booked successfully!');
      navigate('/patient/appointments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const fee = appointmentType === 'video'
    ? (doctor?.videoConsultationFee || doctor?.consultationFee)
    : doctor?.consultationFee;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Book Appointment</h2>

      {/* Doctor Info */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-600">
              {doctor?.user?.firstName?.[0]}{doctor?.user?.lastName?.[0]}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              Dr. {doctor?.user?.firstName} {doctor?.user?.lastName}
            </h3>
            <p className="text-gray-500">{doctor?.specialization}</p>
          </div>
        </div>
      </div>

      {/* Appointment Type */}
      <div className="card">
        <h3 className="font-semibold mb-4">Select Appointment Type</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => setAppointmentType('in-person')}
            className={`p-4 rounded-lg border-2 transition ${
              appointmentType === 'in-person'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiMapPin className="w-6 h-6 text-primary-600" />
                <div className="text-left">
                  <p className="font-medium">In-Person Visit</p>
                  <p className="text-sm text-gray-500">Visit at clinic</p>
                </div>
              </div>
              <p className="font-bold text-primary-600">${doctor?.consultationFee}</p>
            </div>
          </button>

          {doctor?.videoConsultationFee && (
            <button
              onClick={() => setAppointmentType('video')}
              className={`p-4 rounded-lg border-2 transition ${
                appointmentType === 'video'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiVideo className="w-6 h-6 text-primary-600" />
                  <div className="text-left">
                    <p className="font-medium">Video Consultation</p>
                    <p className="text-sm text-gray-500">Online call</p>
                  </div>
                </div>
                <p className="font-bold text-primary-600">${doctor?.videoConsultationFee}</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Date Selection */}
      <div className="card">
        <h3 className="font-semibold mb-4">Select Date</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {getNextDays().map((date) => {
            const dateStr = date.toISOString().split('T')[0];
            const isSelected = selectedDate === dateStr;
            return (
              <button
                key={dateStr}
                onClick={() => {
                  setSelectedDate(dateStr);
                  setSelectedSlot(null);
                }}
                className={`flex-shrink-0 p-3 rounded-lg text-center transition ${
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <p className="text-sm">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className="text-lg font-bold">{date.getDate()}</p>
                <p className="text-xs">
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="card">
          <h3 className="font-semibold mb-4">Select Time</h3>
          {slots.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No available slots for this date
            </p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {slots.map((slot) => (
                <button
                  key={slot._id}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-3 rounded-lg text-center transition ${
                    selectedSlot?._id === slot._id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <FiClock className="w-4 h-4 mx-auto mb-1" />
                  <p className="text-sm font-medium">{slot.startTime}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reason */}
      <div className="card">
        <h3 className="font-semibold mb-4">Reason for Visit (Optional)</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input"
          rows={3}
          placeholder="Briefly describe your symptoms or reason for appointment..."
        />
      </div>

      {/* Summary & Book */}
      <div className="card bg-primary-50 border-primary-200">
        <h3 className="font-semibold mb-4">Booking Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Doctor</span>
            <span className="font-medium">
              Dr. {doctor?.user?.firstName} {doctor?.user?.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Type</span>
            <span className="font-medium capitalize">
              {appointmentType === 'video' ? 'Video Consultation' : 'In-Person Visit'}
            </span>
          </div>
          {selectedDate && (
            <div className="flex justify-between">
              <span className="text-gray-600">Date</span>
              <span className="font-medium">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
          {selectedSlot && (
            <div className="flex justify-between">
              <span className="text-gray-600">Time</span>
              <span className="font-medium">
                {selectedSlot.startTime} - {selectedSlot.endTime}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t mt-2">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-primary-600 text-lg">${fee}</span>
          </div>
        </div>

        <button
          onClick={handleBook}
          disabled={!selectedSlot || booking}
          className="w-full btn btn-primary mt-4 py-3 flex items-center justify-center gap-2"
        >
          {booking ? (
            'Processing...'
          ) : (
            <>
              <FiCheck /> Confirm Booking
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BookAppointment;
