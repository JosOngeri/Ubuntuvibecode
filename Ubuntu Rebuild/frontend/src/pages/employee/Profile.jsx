import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save } from 'lucide-react';
import { toast } from 'react-toastify';

const EmployeeProfile = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, profileRes] = await Promise.all([
        api.get('/employees'),
        api.get('/profiles'),
      ]);
      setEmployee(empRes.data[0] || null);
      setProfile(profileRes.data[0] || null);
    } catch (err) {
      toast.error('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (profile) {
        await api.put(`/profiles/${profile.id}`, formData);
      } else {
        await api.post('/profiles', formData);
      }
      toast.success('Profile updated');
      setEditing(false);
      fetchData();
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
                bio: profile?.bio || '',
                skills: profile?.skills || [],
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
            <div className="w-24 h-24 bg-blue-500 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-bold mb-4">
              {user?.username?.[0]?.toUpperCase() || 'E'}
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {employee?.firstName} {employee?.surname}
            </h2>
            <p className="text-gray-600">{employee?.department}</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail size={18} />
              <span>{user?.email || '-'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Phone size={18} />
              <span>{employee?.phone || '-'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin size={18} />
              <span>{employee?.residentialAddress?.city || '-'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar size={18} />
              <span>Joined: {employee?.dateJoined ? new Date(employee.dateJoined).toLocaleDateString() : '-'}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Employment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Employment Type</p>
                <p className="font-medium">{employee?.employmentType || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Wage Rate</p>
                <p className="font-medium">KES {employee?.wageRate?.toLocaleString() || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium">{employee?.status || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">National ID</p>
                <p className="font-medium">{employee?.nationalId || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">About Me</h3>
            {editing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="4"
              />
            ) : (
              <p className="text-gray-600">{profile?.bio || 'No bio added yet'}</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Skills</h3>
            {editing ? (
              <input
                type="text"
                value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Comma-separated skills"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile?.skills?.map((skill, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                )) || <p className="text-gray-600">No skills added yet</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
