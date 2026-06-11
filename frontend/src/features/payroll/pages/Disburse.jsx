import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import { BsSend, BsCheckCircle, BsXCircle } from 'react-icons/bs';

export default function PayrollDisburse({ standalone = true }) {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disbursing, setDisbursing] = useState(false);

  useEffect(() => {
    loadApprovedPayslips();
  }, []);

  const loadApprovedPayslips = async () => {
    try {
      const response = await api.get('/api/payroll?status=approved');
      setPayslips(response.data || []);
    } catch (err) {
      toast.error('Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  const handleDisburse = async payslipId => {
    try {
      setDisbursing(true);
      await api.post(`/api/payroll/${payslipId}/disburse`);
      toast.success('Payment sent successfully');
      loadApprovedPayslips();
    } catch (err) {
      toast.error('Failed to send payment');
    } finally {
      setDisbursing(false);
    }
  };

  const handleBulkDisburse = async () => {
    try {
      setDisbursing(true);
      await api.post('/api/payroll/disburse-bulk');
      toast.success('Bulk payments sent successfully');
      loadApprovedPayslips();
    } catch (err) {
      toast.error('Failed to send bulk payments');
    } finally {
      setDisbursing(false);
    }
  };

  const content = (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Disburse Payroll</h1>
        <button
          onClick={handleBulkDisburse}
          disabled={disbursing || payslips.length === 0}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
        >
          {disbursing ? 'Sending...' : 'Send All Payments'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : payslips.length === 0 ? (
        <div className="text-center py-8 text-slate-500">No approved payslips to disburse</div>
      ) : (
        <div className="space-y-4">
          {payslips.map(payslip => (
            <div
              key={payslip.id}
              className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {payslip.employee_name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {payslip.period} - KES {payslip.net_pay?.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleDisburse(payslip.id)}
                disabled={disbursing}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                <BsSend className="inline mr-2" />
                Send
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (standalone) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }
  return content;
}
