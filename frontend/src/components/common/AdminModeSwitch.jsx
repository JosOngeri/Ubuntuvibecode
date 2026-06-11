import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Clock, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';
import Modal from './Modal';
import Input from './Input';
import { toast } from 'react-toastify';

const AdminModeSwitch = () => {
  const {
    user,
    isAdminMode,
    adminModeExpiresAt,
    enableAdminMode,
    disableAdminMode,
    isAdminModeActive,
  } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [duration, setDuration] = useState(10);
  const [loading, setLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);

  // Only show for Owner role
  if (user?.role !== 'owner') {
    return null;
  }

  // Calculate remaining time
  useEffect(() => {
    if (!isAdminMode || !adminModeExpiresAt) {
      setRemainingTime(null);
      return;
    }

    const updateRemaining = () => {
      const remaining = new Date(adminModeExpiresAt) - new Date();
      if (remaining <= 0) {
        setRemainingTime(null);
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setRemainingTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [isAdminMode, adminModeExpiresAt]);

  const handleEnable = async () => {
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);

    // Simulate password verification (in real app, verify with backend)
    // For now, we just enable admin mode
    const success = enableAdminMode(duration);

    if (success) {
      toast.success(`Admin mode enabled for ${duration} minutes`);
      setShowModal(false);
      setPassword('');
    } else {
      toast.error('Failed to enable admin mode');
    }

    setLoading(false);
  };

  const handleDisable = () => {
    disableAdminMode();
    toast.info('Admin mode disabled');
  };

  const isActive = isAdminModeActive();

  return (
    <>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          isActive
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
        }`}
      >
        {isActive ? (
          <>
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Admin Mode</span>
            {remainingTime && (
              <span className="text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {remainingTime}
              </span>
            )}
            <button onClick={handleDisable} className="ml-2 text-xs underline hover:no-underline">
              Disable
            </button>
          </>
        ) : (
          <>
            <ShieldAlert className="w-4 h-4" />
            <span className="text-sm font-medium">Protected Mode</span>
            <button
              onClick={() => setShowModal(true)}
              className="ml-2 text-xs underline hover:no-underline"
            >
              Enable Admin Mode
            </button>
          </>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setPassword('');
        }}
        title="Enable Admin Mode"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex gap-3">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Admin mode grants temporary access to delete operations and other sensitive actions.
              This requires password verification and will automatically expire after the selected
              duration.
            </p>
          </div>

          <Input
            type="password"
            label="Confirm Password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium mb-2">Duration</label>
            <div className="flex gap-2">
              {[5, 10, 30].map(mins => (
                <button
                  key={mins}
                  onClick={() => setDuration(mins)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    duration === mins
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              onClick={handleEnable}
              loading={loading}
              disabled={loading || !password}
            >
              Enable Admin Mode
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setPassword('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AdminModeSwitch;
