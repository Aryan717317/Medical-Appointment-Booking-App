import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiSearch, FiStar, FiMapPin, FiFilter } from 'react-icons/fi';
import api from '../services/api';

const DoctorsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    department: searchParams.get('department') || '',
    minRating: searchParams.get('minRating') || '',
    maxFee: searchParams.get('maxFee') || ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [searchParams]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments?active=true');
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      const response = await api.get(`/doctors?${params.toString()}`);
      setDoctors(response.data.doctors || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.department) params.set('department', filters.department);
    if (filters.minRating) params.set('minRating', filters.minRating);
    if (filters.maxFee) params.set('maxFee', filters.maxFee);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({ search: '', department: '', minRating: '', maxFee: '' });
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find a Doctor</h1>
        <p className="text-gray-600 mt-2">
          Search from our network of qualified healthcare professionals
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input pl-10"
                placeholder="Search by name, specialization..."
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <FiFilter /> Filters
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="input"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                  className="input"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Fee
                </label>
                <select
                  value={filters.maxFee}
                  onChange={(e) => setFilters({ ...filters, maxFee: e.target.value })}
                  className="input"
                >
                  <option value="">Any Fee</option>
                  <option value="50">Under $50</option>
                  <option value="100">Under $100</option>
                  <option value="150">Under $150</option>
                  <option value="200">Under $200</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-primary-600 hover:text-primary-700"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No doctors found matching your criteria.</p>
          <button onClick={clearFilters} className="text-primary-600 mt-2">
            Clear filters and try again
          </button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <Link
                key={doctor._id}
                to={`/doctors/${doctor._id}`}
                className="card hover:shadow-lg transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-primary-600">
                      {doctor.user?.firstName?.[0]}{doctor.user?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                    </h3>
                    <p className="text-primary-600 text-sm">{doctor.specialization}</p>
                    <p className="text-gray-500 text-sm">{doctor.department?.name}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <FiStar className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">
                          {doctor.rating?.average?.toFixed(1) || 'New'}
                        </span>
                        <span className="text-gray-400 text-sm">
                          ({doctor.rating?.count || 0})
                        </span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        {doctor.experience || 0} yrs exp
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Consultation Fee</p>
                    <p className="text-lg font-bold text-primary-600">
                      ${doctor.consultationFee}
                    </p>
                  </div>
                  <span className="btn btn-primary text-sm">
                    Book Now
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set('page', page);
                    setSearchParams(params);
                  }}
                  className={`w-10 h-10 rounded-lg ${
                    pagination.page === page
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DoctorsList;
