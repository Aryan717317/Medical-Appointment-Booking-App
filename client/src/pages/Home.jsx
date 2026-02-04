import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FiSearch, FiCalendar, FiVideo, FiShield, FiStar, FiArrowRight } from 'react-icons/fi';
import api from '../services/api';

const Home = () => {
  const [departments, setDepartments] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deptRes, docRes] = await Promise.all([
        api.get('/departments?active=true'),
        api.get('/doctors?limit=4')
      ]);
      setDepartments(deptRes.data.departments || []);
      setTopDoctors(docRes.data.doctors || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Book Your Doctor Appointment Online
              </h1>
              <p className="text-xl text-primary-100 mb-8">
                Find the right doctor, book appointments instantly, and manage your healthcare journey with ease.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/doctors" className="btn bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 text-center">
                  Find a Doctor
                </Link>
                <Link to="/register" className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 px-6 py-3 text-center">
                  Get Started
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600"
                alt="Medical professionals"
                className="rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose MedBook?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: FiSearch, title: 'Easy Search', desc: 'Find doctors by specialty, location, or name' },
              { icon: FiCalendar, title: 'Instant Booking', desc: 'Book appointments in just a few clicks' },
              { icon: FiVideo, title: 'Video Consults', desc: 'Connect with doctors from anywhere' },
              { icon: FiShield, title: 'Secure & Private', desc: 'Your data is protected and encrypted' }
            ].map((feature, idx) => (
              <div key={idx} className="text-center p-6 rounded-xl hover:shadow-lg transition">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Browse by Department</h2>
            <Link to="/doctors" className="text-primary-600 hover:text-primary-700 flex items-center gap-2">
              View All <FiArrowRight />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {departments.slice(0, 8).map((dept) => (
              <Link
                key={dept._id}
                to={`/doctors?department=${dept._id}`}
                className="card hover:shadow-lg transition text-center"
              >
                <div className="text-4xl mb-3">{dept.icon || '🏥'}</div>
                <h3 className="font-semibold">{dept.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Doctors Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Top Rated Doctors</h2>
            <Link to="/doctors" className="text-primary-600 hover:text-primary-700 flex items-center gap-2">
              View All <FiArrowRight />
            </Link>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {topDoctors.map((doctor) => (
              <Link
                key={doctor._id}
                to={`/doctors/${doctor._id}`}
                className="card hover:shadow-lg transition"
              >
                <div className="w-20 h-20 bg-primary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-600">
                    {doctor.user?.firstName?.[0]}{doctor.user?.lastName?.[0]}
                  </span>
                </div>
                <h3 className="font-semibold text-center">
                  Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                </h3>
                <p className="text-gray-600 text-center text-sm">{doctor.specialization}</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <FiStar className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">
                    {doctor.rating?.average?.toFixed(1) || 'New'}
                  </span>
                </div>
                <p className="text-primary-600 font-semibold text-center mt-2">
                  ${doctor.consultationFee}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Book Your Appointment?</h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of patients who trust MedBook for their healthcare needs.
          </p>
          <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-3">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
