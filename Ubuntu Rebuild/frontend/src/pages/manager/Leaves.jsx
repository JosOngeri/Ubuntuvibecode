import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { FileText, Check, X } from 'lucide-react';
import { toast } from 'react-toastify';

const ManagerLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/leaves');
      setLeaves(res.data);
    } catch (err) {
      toast.error('Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/leaves/${id}`, { status: 'approved' });
      toast.success('Leave approved');
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/leaves/${id}`, { status: 'rejected' });
      toast.success('Leave rejected');
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Leave Approvals</h1>
      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{leave.employeeName || '-'}</td>
                  <td className="px-6 py-4">{leave.leaveType}</td>
                  <td className="px-6 py-4">{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{leave.status}</td>
                  <td className="px-6 py-4">
                    {leave.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(leave.id)}><Check className="text-green-600" /></button>
                        <button onClick={() => handleReject(leave.id)}><X className="text-red-600" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerLeaves;
