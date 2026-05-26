import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { UserCheck } from 'lucide-react';
import { toast } from 'react-toastify';

const OwnerOnboarding = () => {
  const [onboarding, setOnboarding] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnboarding();
  }, []);

  const fetchOnboarding = async () => {
    try {
      const res = await api.get('/onboarding');
      setOnboarding(res.data);
    } catch (err) {
      toast.error('Failed to fetch onboarding');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Onboarding</h1>
      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {onboarding.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{o.employeeName || '-'}</td>
                  <td className="px-6 py-4">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OwnerOnboarding;
