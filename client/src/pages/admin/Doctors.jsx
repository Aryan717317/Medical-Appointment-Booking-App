import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiSearch } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDoctors();
  }, [filter]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?isVerified=${filter === 'verified'}` : '';
      const response = await api.get(`/admin/doctors${params}`);
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await api.put(`/admin/doctors/${id}/verify`, { isVerified: status });
      toast.success(status ? 'Doctor verified' : 'Doctor unverified');
      fetchDoctors();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const filteredDoctors = doctors.filter(doc => 
    doc.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    doc.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    doc.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Manage Doctors</h2>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="all">All Doctors</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
        </select>
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
                <th className="px-4 py-3 text-left text-sm font-medium">Doctor</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Specialization</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Experience</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Fee</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredDoctors.map((doc) => (
                <tr key={doc._id}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">
                        Dr. {doc.user?.firstName} {doc.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{doc.user?.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">{doc.specialization}</td>
                  <td className="px-4 py-3">{doc.experience} years</td>
                  <td className="px-4 py-3">${doc.consultationFee}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${doc.isVerified ? 'badge-success' : 'badge-warning'}`}>
                      {doc.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {!doc.isVerified ? (
                      <button
                        onClick={() => handleVerify(doc._id, true)}
                        className="btn btn-primary text-sm flex items-center gap-1"
                      >
                        <FiCheck /> Verify
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerify(doc._id, false)}
                        className="btn btn-secondary text-sm flex items-center gap-1"
                      >
                        <FiX /> Revoke
                      </button>
                    )}
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

export default AdminDoctors;
