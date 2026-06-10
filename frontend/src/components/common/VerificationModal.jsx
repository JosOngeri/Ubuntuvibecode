import React, { useState } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Modal from './Modal';

const VerificationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Verify Action',
  description,
  actionType = 'delete',
  requireReason = true,
  loading = false,
}) => {
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const actionConfig = {
    delete: {
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      buttonVariant: 'danger',
    },
    edit: {
      icon: Lock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      buttonVariant: 'primary',
    },
    critical: {
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      buttonVariant: 'danger',
    },
  };

  const config = actionConfig[actionType] || actionConfig.delete;
  const Icon = config.icon;

  const handleConfirm = () => {
    setError('');

    if (!password) {
      setError('Password is required');
      return;
    }

    if (requireReason && !reason.trim()) {
      setError('Please provide a reason for this action');
      return;
    }

    onConfirm({ password, reason: reason.trim() });
  };

  const handleClose = () => {
    setPassword('');
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${config.bgColor} flex gap-3`}>
          <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
          <div>
            <p className={`text-sm font-medium ${config.color}`}>
              This action requires verification
            </p>
            {description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>
            )}
          </div>
        </div>

        <Input
          type="password"
          label="Confirm Password"
          placeholder="Enter your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          error={error && !password ? error : ''}
        />

        {requireReason && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Reason for this action
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Provide a reason for this action (will be logged)"
              className="form-textarea w-full"
              rows={3}
            />
            {error && !reason.trim() && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
          >
            Confirm
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default VerificationModal;
