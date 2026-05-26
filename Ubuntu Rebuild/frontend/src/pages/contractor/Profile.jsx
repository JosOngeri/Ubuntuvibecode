import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';
import { User, Phone, Mail, Building, Edit, Save } from 'lucide-react';
import { toast } from 'react-toastify';

const ContractorProfile = () => {
  const { user } = useAuth();
  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchContractor();
  }, []);

  const fetchContractor = async () => {
    try {
      const res = await api.get('/contractors');
      setContractor(res.data[0] || null);
    } catch (err) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (contractor) {
        await api.put(`/contractors/${contractor.id}`, formData);
      }
      toast.success('Profile updated');
      setEditing(false);
      fetchContractor();
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        {!editing ? (
          <button
            onClick={() => {
              setEditing(true);
              setFormData({
                phone: contractor?.phone || '',
                email: contractor?.email || '',
              });
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Edit size={18} />
            Edit Profile
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Save size={18} />
            Save
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-teal-500 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-bold mb-4">
              {user?.username?.[0]?.toUpperCase() || 'C'}
            </div>
            <h2 className="text-xl font-bold text-gray-800">{contractor?.companyName}</h2>
            <p className="text-gray-600">Contractor</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <Phone size={18} />
              <span>{contractor?.phone || '-'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Mail size={18} />
              <span>{contractor?.email || '-'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Building size={18} />
              <span>{contractor?.trade || '-'}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Company Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Contact Person</p>
                <p className="font-medium">{contractor?.contactPerson || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium">{contractor?.status || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">KRA PIN</p>
                <p className="font-medium">{contractor?.kraPin || '-'}</p>
              </div>
            </div>
          </div>

          {editing && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractorProfile;
