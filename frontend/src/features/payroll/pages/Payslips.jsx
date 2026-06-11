import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import { BsFileText, BsDownload } from 'react-icons/bs';

export default function EmployeePayslips({ standalone = true }) {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayslips();
  }, []);

  const loadPayslips = async () => {
    try {
      const response = await api.get('/api/payroll/my-payslips');
      setPayslips(response.data || []);
    } catch (err) {
      toast.error('Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async payslipId => {
    try {
      const response = await api.get(`/api/payroll/${payslipId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${payslipId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download payslip');
    }
  };

  const content = (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">My Payslips</h1>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : payslips.length === 0 ? (
        <div className="text-center py-8 text-slate-500">No payslips available</div>
      ) : (
        <div className="space-y-4">
          {payslips.map(payslip => (
            <div
              key={payslip.id}
              className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{payslip.period}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Net Pay: KES {payslip.net_pay?.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">Status: {payslip.status}</p>
              </div>
              <button
                onClick={() => handleDownload(payslip.id)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                <BsDownload className="inline mr-2" />
                Download
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
