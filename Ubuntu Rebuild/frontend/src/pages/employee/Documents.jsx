import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';
import { FolderOpen, Upload, Check, X } from 'lucide-react';
import { toast } from 'react-toastify';

const EmployeeDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data);
    } catch (err) {
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Documents</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Upload size={18} />
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { type: 'national_id', label: 'National ID', required: true },
          { type: 'kra_pin', label: 'KRA PIN', required: true },
          { type: 'nssf', label: 'NSSF Certificate', required: true },
          { type: 'nhif', label: 'NHIF Card', required: true },
          { type: 'certificate', label: 'Academic Certificate', required: false },
          { type: 'cv', label: 'CV/Resume', required: false },
        ].map((docType) => {
          const doc = documents.find(d => d.documentType === docType.type);
          return (
            <div key={docType.type} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">{docType.label}</h3>
                {docType.required && <span className="text-red-500 text-sm">Required</span>}
              </div>
              {doc ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {doc.verified ? (
                      <Check className="text-green-600" size={18} />
                    ) : (
                      <X className="text-red-600" size={18} />
                    )}
                    <span className="text-sm text-gray-600">
                      {doc.verified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Number: {doc.documentNumber || '-'}</p>
                  {doc.expiryDate && (
                    <p className="text-sm text-gray-500">
                      Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                  <button className="text-blue-600 text-sm hover:underline mt-2">
                    View Document
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-2">Not uploaded</p>
                  <button className="text-blue-600 text-sm hover:underline">
                    Upload Now
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeDocuments;
