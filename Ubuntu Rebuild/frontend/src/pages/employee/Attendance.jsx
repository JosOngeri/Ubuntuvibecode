import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';
import { Calendar, Clock, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';

const EmployeeAttendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await api.get('/attendance');
      setAttendance(res.data);
      const today = new Date().toISOString().split('T')[0];
      const todayRec = res.data.find(a => a.attendanceDate.startsWith(today));
      setTodayRecord(todayRec);
    } catch (err) {
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await api.post('/attendance/punch', { action: 'checkIn' });
      toast.success('Checked in successfully');
      fetchAttendance();
    } catch (err) {
      toast.error('Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.post('/attendance/punch', { action: 'checkOut' });
      toast.success('Checked out successfully');
      fetchAttendance();
    } catch (err) {
      toast.error('Failed to check out');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Attendance</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Status</h2>
        {todayRecord ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Clock className="text-green-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Check In</p>
                <p className="text-lg font-medium">{todayRecord.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString() : '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LogOut className="text-blue-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Check Out</p>
                <p className="text-lg font-medium">{todayRecord.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString() : '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Calendar className="text-purple-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Hours Worked</p>
                <p className="text-lg font-medium">{todayRecord.totalHoursWorked || '-'}</p>
              </div>
            </div>
            {!todayRecord.checkOut && (
              <button
                onClick={handleCheckOut}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
              >
                Check Out
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleCheckIn}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Check In
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Attendance History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(record.attendanceDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{record.totalHoursWorked || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      record.status === 'Present' ? 'bg-green-100 text-green-800' :
                      record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {attendance.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No attendance records found
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAttendance;
