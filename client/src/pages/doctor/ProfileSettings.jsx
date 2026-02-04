import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DoctorProfileSettings = () => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    consultationFee: '',
    videoConsultationFee: '',
    slotDuration: 30,
    isAcceptingAppointments: true
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/doctors/my/profile');
      const doc = response.data.doctor;
      setDoctor(doc);
      setFormData({
        bio: doc.bio || '',
        consultationFee: doc.consultationFee || '',
        videoConsultationFee: doc.videoConsultationFee || '',
        slotDuration: doc.slotDuration || 30,
        isAcceptingAppointments: doc.isAcceptingAppointments
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/doctors/my/profile', formData);
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Profile Settings</h2>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-600">
              {doctor?.user?.firstName?.[0]}{doctor?.user?.lastName?.[0]}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-semibold">
              Dr. {doctor?.user?.firstName} {doctor?.user?.lastName}
            </h3>
            <p className="text-gray-500">{doctor?.specialization}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="input"
              rows={4}
              placeholder="Tell patients about yourself..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Consultation Fee ($)
              </label>
              <input
                type="number"
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Video Consultation Fee ($)
              </label>
              <input
                type="number"
                value={formData.videoConsultationFee}
                onChange={(e) => setFormData({ ...formData, videoConsultationFee: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Slot Duration (minutes)
            </label>
            <select
              value={formData.slotDuration}
              onChange={(e) => setFormData({ ...formData, slotDuration: Number(e.target.value) })}
              className="input"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="accepting"
              checked={formData.isAcceptingAppointments}
              onChange={(e) => setFormData({ ...formData, isAcceptingAppointments: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="accepting" className="text-sm">
              Accepting new appointments
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DoctorProfileSettings;
