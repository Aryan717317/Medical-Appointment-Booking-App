import { useState, useEffect } from 'react';
import { FiFileText, FiDownload, FiCalendar } from 'react-icons/fi';
import api from '../../services/api';

const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await api.get('/prescriptions/my');
      setPrescriptions(response.data.prescriptions || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Prescriptions</h2>

      {prescriptions.length === 0 ? (
        <div className="card text-center py-12">
          <FiFileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No prescriptions yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Prescriptions List */}
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <div
                key={prescription._id}
                onClick={() => setSelectedPrescription(prescription)}
                className={`card cursor-pointer transition hover:shadow-lg ${
                  selectedPrescription?._id === prescription._id
                    ? 'ring-2 ring-primary-600'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Dr. {prescription.doctor?.user?.firstName}{' '}
                      {prescription.doctor?.user?.lastName}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {prescription.doctor?.specialization}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <FiCalendar className="w-4 h-4" />
                      {new Date(prescription.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {prescription.pdfUrl && (
                    <a
                      href={prescription.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FiDownload className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm">
                    <span className="font-medium">Diagnosis:</span>{' '}
                    {prescription.diagnosis}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Prescription Detail */}
          {selectedPrescription && (
            <div className="card sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Prescription Details</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Diagnosis</p>
                  <p className="font-medium">{selectedPrescription.diagnosis}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Medications</p>
                  <div className="space-y-3">
                    {selectedPrescription.medications?.map((med, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-gray-600">
                          {med.dosage} | {med.frequency} | {med.duration}
                        </p>
                        {med.instructions && (
                          <p className="text-sm text-gray-500 mt-1">
                            {med.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPrescription.tests?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Recommended Tests</p>
                    <ul className="list-disc list-inside text-sm">
                      {selectedPrescription.tests.map((test, idx) => (
                        <li key={idx}>{test.name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedPrescription.advice && (
                  <div>
                    <p className="text-sm text-gray-500">Advice</p>
                    <p className="text-sm">{selectedPrescription.advice}</p>
                  </div>
                )}

                {selectedPrescription.followUpDate && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      Follow-up: {new Date(selectedPrescription.followUpDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientPrescriptions;
