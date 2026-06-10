import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { BsClock, BsCheckCircle, BsXCircle } from 'react-icons/bs';

export default function Punch() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [punchState, setPunchState] = useState('checkIn');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePunch = async () => {
    try {
      setLoading(true);
      await api.post('/api/attendance/punch', { state: punchState });
      toast.success(`${punchState === 'checkIn' ? 'Checked in' : 'Checked out'} successfully`);
      setPunchState(punchState === 'checkIn' ? 'checkOut' : 'checkIn');
    } catch (err) {
      toast.error('Failed to record punch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="text-center mb-8">
              <BsClock className="w-16 h-16 mx-auto text-orange-500 mb-4" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {currentTime.toLocaleTimeString()}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {currentTime.toLocaleDateString()}
              </p>
            </div>

            <button
              onClick={handlePunch}
              disabled={loading}
              className={`w-full py-4 rounded-lg font-semibold text-white transition ${
                punchState === 'checkIn'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              } disabled:opacity-50`}
            >
              {loading ? 'Processing...' : punchState === 'checkIn' ? 'Check In' : 'Check Out'}
            </button>

            <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              {punchState === 'checkIn' ? (
                <p>Click to start your work day</p>
              ) : (
                <p>Click to end your work day</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
