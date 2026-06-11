import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import api from '../../services/api';
import { employeeAPI } from '../../features/employees/services/employee.api';
import { toast } from 'react-toastify';
import { cn } from '../../lib/utils';
import PageInfoPanel from '../../components/common/PageInfoPanel';
import EmptyState from '../../components/common/EmptyState';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Search,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

const DOC_TYPES = {
  national_id: 'National ID',
  kra_pin: 'KRA PIN',
  nssf: 'NSSF Card',
  nhif: 'NHIF Card',
  certificate: 'Certificate',
  contract: 'Contract',
  offer_letter: 'Offer Letter',
  passport: 'Passport',
  other: 'Other',
};

const EMPTY_FORM = {
  employee_id: '',
  doc_type: 'national_id',
  doc_name: '',
  url: '',
  expiry_date: '',
  notes: '',
  verified: false,
};

const ExpiryBadge = ({ expiry }) => {
  if (!expiry) return null;
  const now = new Date();
  const exp = new Date(expiry);
  const days = Math.ceil((exp - now) / 86400000);
  if (days < 0)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
        <XCircle size={10} /> Expired
      </span>
    );
  if (days <= 30)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        <AlertTriangle size={10} /> Expires in {days}d
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
      <CheckCircle size={10} /> Valid
    </span>
  );
};

export default function DocumentVault({ standalone = true }) {
  const [docs, setDocs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterVerified, setFilterVerified] = useState('');
  const [sortField, setSortField] = useState('doc_name');
  const [sortDirection, setSortDirection] = useState('asc');

  const fetchAll = async () => {
    try {
      const [docsRes, sumRes, empRes] = await Promise.all([
        api.get('/api/documents').catch(() => ({ data: [] })),
        api.get('/api/documents/summary').catch(() => ({ data: {} })),
        employeeAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setDocs(docsRes.data || []);
      setSummary(sumRes.data || {});
      setEmployees(empRes.data || []);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    let result = docs.filter(d => {
      const name =
        `${d.employee_id?.first_name || ''} ${d.employee_id?.last_name || ''} ${d.doc_name} ${DOC_TYPES[d.doc_type] || ''}`.toLowerCase();
      const matchSearch = !search || name.includes(search.toLowerCase());
      const matchType = !filterType || d.doc_type === filterType;
      const matchVerified =
        filterVerified === '' ? true : filterVerified === 'true' ? d.verified : !d.verified;
      return matchSearch && matchType && matchVerified;
    });

    return result.sort((a, b) => {
      let aVal, bVal;
      if (sortField === 'employee') {
        aVal = `${a.employee_id?.first_name || ''} ${a.employee_id?.last_name || ''}`.toLowerCase();
        bVal = `${b.employee_id?.first_name || ''} ${b.employee_id?.last_name || ''}`.toLowerCase();
      } else if (sortField === 'type') {
        aVal = DOC_TYPES[a.doc_type] || a.doc_type;
        bVal = DOC_TYPES[b.doc_type] || b.doc_type;
      } else {
        aVal = a[sortField] || '';
        bVal = b[sortField] || '';
      }
      const comparison = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [docs, search, filterType, filterVerified, sortField, sortDirection]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };
  const openEdit = doc => {
    setEditing(doc._id);
    setForm({
      employee_id: doc.employee_id?._id || doc.employee_id || '',
      doc_type: doc.doc_type || 'national_id',
      doc_name: doc.doc_name || '',
      url: doc.url || '',
      expiry_date: doc.expiry_date ? doc.expiry_date.split('T')[0] : '',
      notes: doc.notes || '',
      verified: doc.verified || false,
    });
    setShowModal(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/documents/${editing}`, form);
        toast.success('Document updated');
      } else {
        await api.post('/api/documents', form);
        toast.success('Document added');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this document record?')) return;
    try {
      await api.delete(`/api/documents/${id}`);
      toast.success('Deleted');
      fetchAll();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleVerify = async id => {
    try {
      await api.put(`/api/documents/${id}/verify`);
      toast.success('Document marked as verified');
      fetchAll();
    } catch {
      toast.error('Failed to verify');
    }
  };

  const statsCards = [
    { label: 'Total Documents', value: summary.total || 0, icon: FileText, color: 'bg-blue-500' },
    { label: 'Verified', value: summary.verified || 0, icon: ShieldCheck, color: 'bg-green-500' },
    {
      label: 'Expiring Soon (30d)',
      value: summary.expiring_soon || 0,
      icon: Clock,
      color: 'bg-amber-500',
    },
    { label: 'Expired', value: summary.expired || 0, icon: AlertTriangle, color: 'bg-red-500' },
  ];

  const content = (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={24} className="text-orange-500" />
            Document Vault
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Store and verify employee compliance documents — IDs, KRA, NSSF, NHIF, certificates
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus size={16} /> Add Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statsCards.map((s, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3"
          >
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
            placeholder="Search employee or document name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
        >
          <option value="">All Types</option>
          {Object.entries(DOC_TYPES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={filterVerified}
          onChange={e => setFilterVerified(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
        >
          <option value="">All Verification</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading documents…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents found"
            description="Add employee compliance documents to maintain a complete record."
          />
        ) : (
          <Table
            columns={[
              {
                key: 'employee',
                label: 'Employee',
                sortable: true,
                render: (_, row) => {
                  const emp = row.employee_id;
                  return (
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {emp ? `${emp.first_name} ${emp.last_name}` : '—'}
                      </span>
                      {emp?.department && (
                        <span className="block text-xs text-slate-400">{emp.department}</span>
                      )}
                    </div>
                  );
                },
              },
              {
                key: 'doc_name',
                label: 'Document',
                sortable: true,
                render: (_, row) => (
                  <div>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{row.doc_name}</p>
                    {row.url && (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-orange-500 hover:underline"
                      >
                        View file ↗
                      </a>
                    )}
                  </div>
                ),
              },
              {
                key: 'type',
                label: 'Type',
                sortable: true,
                render: (_, row) => DOC_TYPES[row.doc_type] || row.doc_type,
              },
              {
                key: 'expiry_date',
                label: 'Expiry',
                sortable: true,
                render: val =>
                  val ? (
                    <div>
                      <p className="text-xs text-slate-500">{new Date(val).toLocaleDateString()}</p>
                      <ExpiryBadge expiry={val} />
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">No expiry</span>
                  ),
              },
              {
                key: 'verified',
                label: 'Verified',
                sortable: true,
                render: (val, row) =>
                  val ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      <ShieldCheck size={10} /> Verified
                    </span>
                  ) : (
                    <button
                      onClick={() => handleVerify(row._id)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-700 dark:bg-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <ShieldCheck size={10} /> Mark Verified
                    </button>
                  ),
              },
              {
                key: 'actions',
                label: 'Actions',
                sortable: false,
                render: (_, row) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(row)}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-orange-500 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(row._id)}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ),
              },
            ]}
            data={filtered}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={field => {
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
        <Modal
          title={editing ? 'Edit Document' : 'Add Document'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Employee *
                </label>
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
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Document Type *
                </label>
                <select
                  value={form.doc_type}
                  onChange={e => setForm({ ...form, doc_type: e.target.value })}
                  required
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  {Object.entries(DOC_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Document Name *"
                value={form.doc_name}
                onChange={e => setForm({ ...form, doc_name: e.target.value })}
                placeholder="e.g. John Doe National ID"
                required
                className="sm:col-span-2"
              />
              <Input
                label="File URL"
                value={form.url}
                onChange={e => setForm({ ...form, url: e.target.value })}
                placeholder="https://…"
                className="sm:col-span-2"
              />
              <Input
                label="Expiry Date"
                type="date"
                value={form.expiry_date}
                onChange={e => setForm({ ...form, expiry_date: e.target.value })}
              />
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="verified-check"
                  checked={form.verified}
                  onChange={e => setForm({ ...form, verified: e.target.checked })}
                  className="w-4 h-4 text-orange-500 rounded"
                />
                <label
                  htmlFor="verified-check"
                  className="text-sm text-slate-700 dark:text-slate-300"
                >
                  Mark as Verified
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                placeholder="Additional notes…"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                {editing ? 'Update' : 'Save'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <PageInfoPanel
        title="Document Vault"
        description="Centralised storage for employee compliance and identity documents"
        steps={[
          'Click + Add Document to log a document for an employee (National ID, KRA, NSSF, NHIF, etc.).',
          'Paste the file URL (Google Drive, SharePoint, or uploaded file path) in the File URL field.',
          'Set an expiry date for documents that need renewal (e.g. passport, permit).',
          'Click Mark Verified once the original document has been physically checked.',
          'Monitor the Expiring Soon count on the stats bar to act before documents lapse.',
        ]}
        faqs={[
          {
            q: 'Can employees upload their own documents?',
            a: 'Not directly yet — HR/Admin uploads on their behalf. Self-service upload is planned for a future version.',
          },
          {
            q: 'What happens when a document expires?',
            a: 'It is flagged with an "Expired" badge and counted in the Expired stat. No automatic notifications yet — check the vault regularly.',
          },
          {
            q: 'Is the file stored on the server?',
            a: 'The vault stores URLs only. Files should be hosted on a cloud service (Google Drive, Dropbox, SharePoint) and the link pasted here.',
          },
        ]}
        fetchStatus={async () => {
          const items = [];
          try {
            const res = await api.get('/api/documents/summary').catch(() => ({ data: {} }));
            const s = res.data || {};
            if (s.expired > 0)
              items.push({
                level: 'error',
                message: `${s.expired} document${s.expired > 1 ? 's have' : ' has'} expired`,
                detail: 'Request updated documents from affected employees.',
              });
            if (s.expiring_soon > 0)
              items.push({
                level: 'warn',
                message: `${s.expiring_soon} document${s.expiring_soon > 1 ? 's expire' : ' expires'} within 30 days`,
                detail: 'Contact employees to provide renewed copies.',
              });
            if (s.unverified > 0)
              items.push({
                level: 'info',
                message: `${s.unverified} document${s.unverified > 1 ? 's are' : ' is'} unverified`,
                detail: 'Verify original documents and mark them verified.',
              });
            if (items.length === 0)
              items.push({
                level: 'success',
                message: 'All documents are verified and up to date.',
              });
          } catch {
            items.push({ level: 'info', message: 'Could not retrieve document status.' });
          }
          return items;
        }}
      />
    </div>
  );

  return standalone ? <DashboardLayout>{content}</DashboardLayout> : content;
}
