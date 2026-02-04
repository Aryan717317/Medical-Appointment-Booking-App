import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DoctorSlots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlot, setNewSlot] = useState({ startTime: '09:00', endTime: '09:30' });

  useEffect(() => {
    fetchSlots();
  }, [selectedDate]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/slots/my?date=${selectedDate}&showAll=true`);
      setSlots(response.data.slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    try {
      await api.post('/slots', {
        date: selectedDate,
        ...newSlot
      });
      toast.success('Slot added');
      setShowAddModal(false);
      fetchSlots();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add slot');
    }
  };

  const handleDeleteSlot = async (id) => {
    try {
      await api.delete(`/slots/${id}`);
      toast.success('Slot deleted');
      fetchSlots();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Slots</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus /> Add Slot
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Select Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input max-w-xs"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-4 gap-4">
          {slots.length === 0 ? (
            <p className="text-gray-500 col-span-4 text-center py-8">
              No slots for this date
            </p>
          ) : (
            slots.map((slot) => (
              <div
                key={slot._id}
                className={`card ${
                  slot.bookedCount > 0 ? 'bg-green-50' : ''
                } ${slot.isBlocked ? 'bg-gray-100' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{slot.startTime} - {slot.endTime}</p>
                    <p className="text-sm text-gray-500">
                      {slot.bookedCount > 0 ? 'Booked' : 'Available'}
                    </p>
                  </div>
                  {slot.bookedCount === 0 && (
                    <button
                      onClick={() => handleDeleteSlot(slot._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Slot</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSlot}
                className="btn btn-primary flex-1"
              >
                Add Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSlots;
