import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import contractorLifecycleAPI from '../../services/contractorLifecycleAPI';
import { toast } from 'react-toastify';
import { cn } from '../../lib/utils';
import { TrainingEmptyState } from '../../components/common/EmptyState';
import PageInfoPanel from '../../components/common/PageInfoPanel';
import TabNavigation from '../../components/common/TabNavigation';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  TrendingUp,
  DollarSign,
  Calendar,
  Target,
} from 'lucide-react';

const EMPTY_QUOTE_FORM = {
  project_title: '',
  description: '',
  amount: '',
  timeline: '',
  is_daily_wage: false,
  daily_rate: '',
  estimated_days: '',
  notes: '',
};

const EMPTY_MILESTONE_FORM = {
  quote_id: '',
  title: '',
  description: '',
  deadline: '',
  budget: '',
  status: 'pending',
};

export default function ContractorLifecycle({ standalone = true }) {
  const [activeTab, setActiveTab] = useState('quotes');
  const [quotes, setQuotes] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [quoteForm, setQuoteForm] = useState(EMPTY_QUOTE_FORM);
  const [milestoneForm, setMilestoneForm] = useState(EMPTY_MILESTONE_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchAll = async () => {
    try {
      const [quotesRes, milestonesRes, kpiRes] = await Promise.all([
        contractorLifecycleAPI.getQuotes().catch(() => ({ data: [] })),
        contractorLifecycleAPI.getMilestones().catch(() => ({ data: [] })),
        contractorLifecycleAPI.getKPI().catch(() => ({ data: [] })),
      ]);
      setQuotes(quotesRes.data || []);
      setMilestones(milestonesRes.data || []);
      setKpiData(kpiRes.data || []);
    } catch {
      toast.error('Failed to load contractor lifecycle data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSaveQuote = async e => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingQuote) {
        await contractorLifecycleAPI.createQuote({ ...quoteForm, id: editingQuote.id });
        toast.success('Quote updated successfully');
      } else {
        await contractorLifecycleAPI.createQuote(quoteForm);
        toast.success('Quote created successfully');
      }
      setShowQuoteModal(false);
      setEditingQuote(null);
      setQuoteForm(EMPTY_QUOTE_FORM);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save quote');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveQuote = async id => {
    try {
      await contractorLifecycleAPI.approveQuote(id);
      toast.success('Quote approved successfully');
      fetchAll();
    } catch (err) {
      toast.error('Failed to approve quote');
    }
  };

  const handleRejectQuote = async id => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await contractorLifecycleAPI.rejectQuote(id, reason);
      toast.success('Quote rejected successfully');
      fetchAll();
    } catch (err) {
      toast.error('Failed to reject quote');
    }
  };

  const handleSaveMilestone = async e => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingMilestone) {
        await contractorLifecycleAPI.createMilestone({ ...milestoneForm, id: editingMilestone.id });
        toast.success('Milestone updated successfully');
      } else {
        await contractorLifecycleAPI.createMilestone(milestoneForm);
        toast.success('Milestone created successfully');
      }
      setShowMilestoneModal(false);
      setEditingMilestone(null);
      setMilestoneForm(EMPTY_MILESTONE_FORM);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save milestone');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProgress = async (id, progress) => {
    try {
      await contractorLifecycleAPI.updateProgress(id, progress);
      toast.success('Progress updated successfully');
      fetchAll();
    } catch (err) {
      toast.error('Failed to update progress');
    }
  };

  const handleVerifyMilestone = async id => {
    const kpiScore = prompt('Enter KPI score (0-100):');
    if (!kpiScore) return;
    try {
      await contractorLifecycleAPI.verifyMilestone(id, kpiScore);
      toast.success('Milestone verified successfully');
      fetchAll();
    } catch (err) {
      toast.error('Failed to verify milestone');
    }
  };

  const handleReleasePayment = async id => {
    const amount = prompt('Enter payment amount:');
    if (!amount) return;
    try {
      await contractorLifecycleAPI.releasePayment(id, amount);
      toast.success('Payment released successfully');
      fetchAll();
    } catch (err) {
      toast.error('Failed to release payment');
    }
  };

  const quoteColumns = [
    {
      header: 'Project',
      render: row => <span className="font-medium">{row.project_title || '-'}</span>,
    },
    {
      header: 'Amount',
      render: row => <span className="text-slate-600 dark:text-slate-400">${row.amount || '-'}</span>,
    },
    {
      header: 'Timeline',
      render: row => <span className="text-sm text-slate-600 dark:text-slate-400">{row.timeline || '-'}</span>,
    },
    {
      header: 'Status',
      render: row => (
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          row.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
          row.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
        )}>
          {row.status || 'pending'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: row => (
        <div className="flex gap-2">
          {row.status === 'pending' && (
            <>
              <Button size="sm" variant="ghost" onClick={() => handleApproveQuote(row.id)}>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleRejectQuote(row.id)}>
                <XCircle className="w-4 h-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const milestoneColumns = [
    {
      header: 'Title',
      render: row => <span className="font-medium">{row.title || '-'}</span>,
    },
    {
      header: 'Deadline',
      render: row => <span className="text-sm text-slate-600 dark:text-slate-400">{row.deadline || '-'}</span>,
    },
    {
      header: 'Budget',
      render: row => <span className="text-slate-600 dark:text-slate-400">{row.budget || '-'}</span>,
    },
    {
      header: 'Progress',
      render: row => (
        <div className="flex items-center gap-2">
          <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all"
              style={{ width: `${row.progress || 0}%` }}
            />
          </div>
          <span className="text-sm">{row.progress || 0}%</span>
        </div>
      ),
    },
    {
      header: 'Status',
      render: row => (
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          row.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
          row.status === 'verified' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
          row.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
          'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300'
        )}>
          {row.status || 'pending'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: row => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleUpdateProgress(row.id, Math.min((row.progress || 0) + 10, 100))}>
            <TrendingUp className="w-4 h-4" />
          </Button>
          {row.status !== 'verified' && (
            <Button size="sm" variant="ghost" onClick={() => handleVerifyMilestone(row.id)}>
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
          {row.status === 'verified' && (
            <Button size="sm" variant="ghost" onClick={() => handleReleasePayment(row.id)}>
              <DollarSign className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const tabs = [
    { id: 'quotes', label: 'Quotes', icon: FileText },
    { id: 'milestones', label: 'Milestones', icon: Target },
    { id: 'kpi', label: 'KPI Dashboard', icon: TrendingUp },
  ];

  return (
    <DashboardLayout>
      <PageInfoPanel
        title="Contractor Lifecycle"
        description="Manage contractor quotes, milestones, and KPI tracking"
        icon={<TrendingUp className="w-6 h-6" />}
        breadcrumbs={[{ label: 'Contractors', href: '/contractor/dashboard' }, { label: 'Lifecycle' }]}
      />

      <Card className="mb-6">
        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </Card>

      {activeTab === 'quotes' && (
        <>
          <Card className="mb-6">
            <div className="flex justify-between items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search quotes..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => { setEditingQuote(null); setQuoteForm(EMPTY_QUOTE_FORM); setShowQuoteModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                New Quote
              </Button>
            </div>
          </Card>

          {loading ? (
            <Card>
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
              </div>
            </Card>
          ) : quotes.length === 0 ? (
            <TrainingEmptyState
              title="No quotes found"
              description="Create your first contractor quote to get started"
              actionLabel="Create Quote"
              onAction={() => { setEditingQuote(null); setQuoteForm(EMPTY_QUOTE_FORM); setShowQuoteModal(true); }}
            />
          ) : (
            <Card>
              <Table columns={quoteColumns} data={quotes} />
            </Card>
          )}
        </>
      )}

      {activeTab === 'milestones' && (
        <>
          <Card className="mb-6">
            <div className="flex justify-between items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search milestones..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => { setEditingMilestone(null); setMilestoneForm(EMPTY_MILESTONE_FORM); setShowMilestoneModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                New Milestone
              </Button>
            </div>
          </Card>

          {loading ? (
            <Card>
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
              </div>
            </Card>
          ) : milestones.length === 0 ? (
            <TrainingEmptyState
              title="No milestones found"
              description="Create your first milestone to track project progress"
              actionLabel="Create Milestone"
              onAction={() => { setEditingMilestone(null); setMilestoneForm(EMPTY_MILESTONE_FORM); setShowMilestoneModal(true); }}
            />
          ) : (
            <Card>
              <Table columns={milestoneColumns} data={milestones} />
            </Card>
          )}
        </>
      )}

      {activeTab === 'kpi' && (
        <Card>
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Contractor KPI Dashboard</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Track contractor performance metrics and KPI scores
            </p>
            <Button onClick={fetchAll}>Refresh Data</Button>
          </div>
        </Card>
      )}

      <Modal
        isOpen={showQuoteModal}
        onClose={() => { setShowQuoteModal(false); setEditingQuote(null); setQuoteForm(EMPTY_QUOTE_FORM); }}
        title={editingQuote ? 'Edit Quote' : 'New Quote'}
      >
        <form onSubmit={handleSaveQuote} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project Title</label>
            <Input
              value={quoteForm.project_title}
              onChange={e => setQuoteForm({ ...quoteForm, project_title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              value={quoteForm.description}
              onChange={e => setQuoteForm({ ...quoteForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <Input
                type="number"
                value={quoteForm.amount}
                onChange={e => setQuoteForm({ ...quoteForm, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Timeline</label>
              <Input
                value={quoteForm.timeline}
                onChange={e => setQuoteForm({ ...quoteForm, timeline: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_daily_wage"
              checked={quoteForm.is_daily_wage}
              onChange={e => setQuoteForm({ ...quoteForm, is_daily_wage: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="is_daily_wage" className="text-sm">Daily wage mode</label>
          </div>
          {quoteForm.is_daily_wage && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Daily Rate</label>
                <Input
                  type="number"
                  value={quoteForm.daily_rate}
                  onChange={e => setQuoteForm({ ...quoteForm, daily_rate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estimated Days</label>
                <Input
                  type="number"
                  value={quoteForm.estimated_days}
                  onChange={e => setQuoteForm({ ...quoteForm, estimated_days: e.target.value })}
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
              value={quoteForm.notes}
              onChange={e => setQuoteForm({ ...quoteForm, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowQuoteModal(false); setEditingQuote(null); setQuoteForm(EMPTY_QUOTE_FORM); }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingQuote ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showMilestoneModal}
        onClose={() => { setShowMilestoneModal(false); setEditingMilestone(null); setMilestoneForm(EMPTY_MILESTONE_FORM); }}
        title={editingMilestone ? 'Edit Milestone' : 'New Milestone'}
      >
        <form onSubmit={handleSaveMilestone} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              value={milestoneForm.title}
              onChange={e => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              value={milestoneForm.description}
              onChange={e => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Deadline</label>
              <Input
                type="date"
                value={milestoneForm.deadline}
                onChange={e => setMilestoneForm({ ...milestoneForm, deadline: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Budget</label>
              <Input
                type="number"
                value={milestoneForm.budget}
                onChange={e => setMilestoneForm({ ...milestoneForm, budget: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={milestoneForm.status}
              onChange={e => setMilestoneForm({ ...milestoneForm, status: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="verified">Verified</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowMilestoneModal(false); setEditingMilestone(null); setMilestoneForm(EMPTY_MILESTONE_FORM); }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingMilestone ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
