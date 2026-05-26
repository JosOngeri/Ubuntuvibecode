import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import api, { employeeAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { cn } from '../../lib/utils';
import { TrainingEmptyState } from '../../components/common/EmptyState';
import PageInfoPanel from '../../components/common/PageInfoPanel';
import {
  BookOpen, Plus, Pencil, Trash2, Trophy,
  Clock, CheckCircle, XCircle, Search, DollarSign
} from 'lucide-react';

const STATUS_CONFIG = {
  planned:     { label: 'Planned',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const TYPE_LABELS = {
  internal: 'Internal', external: 'External', online: 'Online',
  conference: 'Conference', certification: 'Certification',
};

const EMPTY_FORM = {
  employee_id: '', course_name: '', provider: '', training_type: 'internal',
  start_date: '', end_date: '', status: 'planned', score: '', cost: '', notes: '', certificate_url: '',
};

export default function Training({ standalone = true }) {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState('course_name');
  const [sortDirection, setSortDirection] = useState('asc');

  const fetchAll = async () => {
    try {
      const [recRes, sumRes, empRes] = await Promise.all([
        api.get('/api/training').catch(() => ({ data: [] })),
        api.get('/api/training/summary').catch(() => ({ data: {} })),
        employeeAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setRecords(recRes.data || []);
      setSummary(sumRes.data || {});
      setEmployees(empRes.data || []);
    } catch {
      toast.error('Failed to load training data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    let result = records.filter(r => {
      const name = `${r.employee_id?.first_name || ''} ${r.employee_id?.last_name || ''} ${r.course_name} ${r.provider || ''}`.toLowerCase();
      const matchSearch = !search || name.includes(search.toLowerCase());
      const matchStatus = !filterStatus || r.status === filterStatus;
      return matchSearch && matchStatus;
    });

    return result.sort((a, b) => {
      let aVal, bVal;
      if (sortField === 'employee') {
        aVal = `${a.employee_id?.first_name || ''} ${a.employee_id?.last_name || ''}`.toLowerCase();
        bVal = `${b.employee_id?.first_name || ''} ${b.employee_id?.last_name || ''}`.toLowerCase();
      } else if (sortField === 'dates') {
        aVal = a.start_date || '';
        bVal = b.start_date || '';
      } else {
        aVal = a[sortField] || '';
        bVal = b[sortField] || '';
      }
      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [records, search, filterStatus, sortField, sortDirection]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (rec) => {
    setEditing(rec._id);
    setForm({
      employee_id: rec.employee_id?._id || rec.employee_id || '',
      course_name: rec.course_name || '',
      provider: rec.provider || '',
      training_type: rec.training_type || 'internal',
      start_date: rec.start_date ? rec.start_date.split('T')[0] : '',
      end_date: rec.end_date ? rec.end_date.split('T')[0] : '',
      status: rec.status || 'planned',
      score: rec.score ?? '',
      cost: rec.cost ?? '',
      notes: rec.notes || '',
      certificate_url: rec.certificate_url || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.score && payload.score !== 0) delete payload.score;
      if (!payload.cost && payload.cost !== 0) delete payload.cost;
      if (editing) {
        await api.put(`/api/training/${editing}`, payload);
        toast.success('Training record updated');
      } else {
        await api.post('/api/training', payload);
        toast.success('Training record created');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this training record?')) return;
    try {
      await api.delete(`/api/training/${id}`);
      toast.success('Deleted');
      fetchAll();
    } catch { toast.error('Failed to delete'); }
  };

  const statsCards = [
    { label: 'Total Records', value: summary.total || 0, icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Completed', value: summary.completed || 0, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'In Progress', value: summary.in_progress || 0, icon: Clock, color: 'bg-amber-500' },
    { label: 'Total Cost (KES)', value: (summary.total_cost || 0).toLocaleString(), icon: DollarSign, color: 'bg-purple-500' },
  ];

  const content = (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={24} className="text-orange-500" />
            Training &amp; Development
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track employee training records, certifications, and development plans</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus size={16} /> Add Training Record
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statsCards.map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', s.color)}>
              <s.icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, course or provider…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading training records…</div>
        ) : filtered.length === 0 ? (
          <TrainingEmptyState />
        ) : (
          <Table
            columns={[
              { 
                key: 'employee', 
                label: 'Employee', 
                sortable: true,
                render: (_, row) => row.employee_id ? `${row.employee_id.first_name} ${row.employee_id.last_name}` : '—'
              },
              { key: 'course_name', label: 'Course', sortable: true },
              { key: 'provider', label: 'Provider', sortable: true },
              { key: 'training_type', label: 'Type', sortable: true, render: (val) => TYPE_LABELS[val] || val },
              { 
                key: 'dates', 
                label: 'Dates', 
                sortable: true,
                render: (_, row) => (
                  <span className="text-xs whitespace-nowrap">
                    {row.start_date ? new Date(row.start_date).toLocaleDateString() : '—'}
                    {row.end_date ? ` → ${new Date(row.end_date).toLocaleDateString()}` : ''}
                  </span>
                )
              },
              { 
                key: 'status', 
                label: 'Status', 
                sortable: true,
                render: (val) => {
                  const cfg = STATUS_CONFIG[val] || STATUS_CONFIG.planned;
                  return <span className={cn('inline-block px-2 py-0.5 text-xs font-medium rounded-full', cfg.color)}>{cfg.label}</span>;
                }
              },
              { key: 'score', label: 'Score', sortable: true, render: (val) => val != null ? `${val}%` : '—' },
              {
                key: 'actions',
                label: 'Actions',
                sortable: false,
                render: (_, row) => (
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-orange-500 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(row._id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              },
            ]}
            data={filtered}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={(field) => {
              if (sortField === field) {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              } else {
                setSortField(field);
                setSortDirection('asc');
              }
            }}
          />
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Training Record' : 'Add Training Record'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Employee *</label>
                <select
                  value={form.employee_id}
                  onChange={e => setForm({ ...form, employee_id: e.target.value })}
                  required
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e._id || e.id} value={e._id || e.id}>
                      {e.first_name} {e.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Course Name *" value={form.course_name} onChange={e => setForm({ ...form, course_name: e.target.value })} required />
              <Input label="Provider / Institution" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Training Type</label>
                <select
                  value={form.training_type}
                  onChange={e => setForm({ ...form, training_type: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <Input label="Start Date" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              <Input label="End Date" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <Input label="Score (%)" type="number" min="0" max="100" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} placeholder="0–100" />
              <Input label="Cost (KES)" type="number" min="0" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
              <Input label="Certificate URL" value={form.certificate_url} onChange={e => setForm({ ...form, certificate_url: e.target.value })} className="sm:col-span-2" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                placeholder="Training notes, outcomes, feedback…"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={saving}>{editing ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </Modal>
      )}

      <PageInfoPanel
        title="Training & Development"
        description="Track and manage employee training programs and certifications"
        steps={[
          'Click + Add Training Record to log a new training event for an employee.',
          'Select the employee, course name, provider, training type (internal/external/online/certification).',
          'Set start/end dates and initial status (Planned or In Progress).',
          'Once training is complete, update the record to Completed and enter the score achieved.',
          'Attach the certificate URL for record-keeping and audits.',
        ]}
        faqs={[
          { q: 'How does training data affect payroll or KPI?', a: 'Training records are tracked independently. Completed certifications can be referenced in KPI assessments but do not auto-affect payroll.' },
          { q: 'Can employees see their own training records?', a: 'The employee profile page shows a summary of their training history.' },
          { q: 'Is there a way to bulk import training records?', a: 'Use the CSV import template in Settings → Data Import. Include employee_id, course_name, provider, dates, and status columns.' },
        ]}
        fetchStatus={async () => {
          const items = [];
          try {
            const res = await api.get('/api/training').catch(() => ({ data: [] }));
            const all = res.data || [];
            const overdue = all.filter(r => r.status === 'planned' && r.start_date && new Date(r.start_date) < new Date());
            if (overdue.length > 0) items.push({ level: 'warn', message: `${overdue.length} planned training${overdue.length > 1 ? 's have' : ' has'} a past start date`, detail: 'Update the status to In Progress or reschedule.' });
            const noScore = all.filter(r => r.status === 'completed' && r.score == null);
            if (noScore.length > 0) items.push({ level: 'info', message: `${noScore.length} completed training record${noScore.length > 1 ? 's have' : ' has'} no score recorded` });
            if (items.length === 0) items.push({ level: 'success', message: 'All training records are up to date.' });
          } catch { items.push({ level: 'info', message: 'Could not retrieve training status.' }); }
          return items;
        }}
      />
    </div>
  );

  return standalone ? <DashboardLayout>{content}</DashboardLayout> : content;
}
