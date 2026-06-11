import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  BsPersonCheck,
  BsFileText,
  BsBoxArrowRight,
  BsCalendarCheck,
  BsStar,
  BsCheckCircle,
  BsClock,
  BsBuilding,
  BsPerson,
} from 'react-icons/bs';
import PageInfoPanel from '../../components/common/PageInfoPanel';
import { OnboardingEmptyState } from '../../components/common/EmptyState';

const STEPS = [
  { name: 'offer_letter', label: 'Offer Letter', icon: BsFileText },
  { name: 'documents', label: 'Documents', icon: BsFileText },
  { name: 'department_assignment', label: 'Dept & Supervisor', icon: BsBuilding },
  { name: 'asset_allocation', label: 'Asset Allocation', icon: BsBoxArrowRight },
  { name: 'orientation', label: 'Orientation', icon: BsCalendarCheck },
  { name: 'probation_review_1', label: 'Probation Review #1', icon: BsStar },
  { name: 'probation_review_2', label: 'Probation Review #2', icon: BsStar },
  { name: 'confirmation', label: 'Confirmation', icon: BsCheckCircle },
];
export default function OnboardingPage({ standalone = true }) {
  const navigate = useNavigate();
  const [onboardings, setOnboardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [showInitiate, setShowInitiate] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    department: '',
    position: '',
    probationMonths: 3,
    supervisorRole: '',
    supervisorId: '',
    assets: { uniform: '', tools: '' },
  });
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [importing, setImporting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewId, setReviewId] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    score: 80,
    comments: '',
    recommendation: 'confirm',
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [oRes, eRes, aRes] = await Promise.all([
        api.get('/onboarding').catch(() => ({ data: [] })),
        api.get('/employees').catch(() => ({ data: [] })),
        api.get('/jobs/my-applications').catch(() => ({ data: [] })),
      ]);
      setOnboardings(oRes.data || []);
      setEmployees((eRes.data || []).filter(e => e.status !== 'Active'));
      setApplications(aRes.data || []);
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);
  const initiate = async () => {
    try {
      await api.post('/onboarding', form);
      toast.success('Started');
      setShowInitiate(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed');
    }
  };

  const completeStep = async (id, stepName) => {
    try {
      await api.put('/onboarding/' + id + '/step', { stepName });
      toast.success('Done');
      fetchAll();
    } catch {
      toast.error('Failed');
    }
  };

  const addReview = async id => {
    setReviewId(id);
    setReviewForm({ score: 80, comments: '', recommendation: 'confirm' });
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    try {
      await api.post('/onboarding/' + reviewId + '/review', {
        score: +reviewForm.score,
        comments: reviewForm.comments,
        recommendation: reviewForm.recommendation,
      });
      toast.success('Review added');
      setShowReviewModal(false);
      fetchAll();
    } catch {
      toast.error('Failed');
    }
  };

  const generateLetter = async id => {
    try {
      await api.post('/onboarding/' + id + '/offer-letter');
      toast.success('Letter generated');
      fetchAll();
    } catch {
      toast.error('Failed');
    }
  };

  const importApplicationToEmployee = async (applicationId, employeeId) => {
    setImporting(true);
    try {
      await api.post(`/jobs/applications/${applicationId}/import-to-employee/${employeeId}`);
      toast.success('Application data imported successfully');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleApplicationSelect = applicationId => {
    setSelectedApplication(applicationId);
    const app = applications.find(a => String(a.id) === String(applicationId));
    if (!app) return;
    const positionDetails = app.positionDetails || {};
    setForm({
      ...form,
      department: positionDetails.department || form.department,
      position: positionDetails.position || form.position,
    });
  };

  const getDone = (o, name) => o.steps?.find(s => s.name === name)?.completed;
  const inProg = onboardings.filter(o => o.status === 'in_progress').length;
  const done = onboardings.filter(o => o.status === 'completed').length;
  const content = (
    <div>
      <div className="page-header mb-6">
        <h1 className="page-title">Onboarding</h1>
        <p className="page-subtitle">
          Track employee onboarding from offer letter to confirmation.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => toast.info('Showing all onboardings')}
        >
          <div className="stat-card">
            <span className="stat-label">Total</span>
            <span className="stat-value">{onboardings.length}</span>
            <p className="text-xs text-blue-500 mt-1">Click to view →</p>
          </div>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => toast.info('Showing in-progress onboardings')}
        >
          <div className="stat-card">
            <span className="stat-label">In Progress</span>
            <span className="stat-value text-blue-600">{inProg}</span>
            <p className="text-xs text-blue-500 mt-1">Click to view →</p>
          </div>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => toast.info('Showing completed onboardings')}
        >
          <div className="stat-card">
            <span className="stat-label">Completed</span>
            <span className="stat-value text-green-600">{done}</span>
            <p className="text-xs text-blue-500 mt-1">Click to view →</p>
          </div>
        </Card>
      </div>
      <div className="flex gap-2 mb-4">
        <Button variant="primary" size="sm" onClick={() => setShowInitiate(!showInitiate)}>
          + New Onboarding
        </Button>
      </div>
      {showInitiate && (
        <Card className="mb-4">
          <h3 className="font-bold mb-3">Initiate Onboarding</h3>
          <div className="grid grid-cols-2 gap-3">
            <select
              className="form-select text-sm"
              value={form.employeeId}
              onChange={e => setForm({ ...form, employeeId: e.target.value })}
            >
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName}
                </option>
              ))}
            </select>
            <input
              className="form-input text-sm"
              placeholder="Department"
              value={form.department}
              onChange={e => setForm({ ...form, department: e.target.value })}
            />
            <input
              className="form-input text-sm"
              placeholder="Position"
              value={form.position}
              onChange={e => setForm({ ...form, position: e.target.value })}
            />
            <input
              className="form-input text-sm"
              placeholder="Probation Months"
              type="number"
              value={form.probationMonths}
              onChange={e => setForm({ ...form, probationMonths: +e.target.value })}
            />
            <select
              className="form-select text-sm"
              value={form.supervisorRole}
              onChange={e => setForm({ ...form, supervisorRole: e.target.value })}
            >
              <option value="">Select Supervisor Role</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="hr">HR</option>
            </select>
            <select
              className="form-select text-sm"
              value={form.supervisorId}
              onChange={e => setForm({ ...form, supervisorId: e.target.value })}
            >
              <option value="">Select Supervisor</option>
              {employees
                .filter(e => e.role === form.supervisorRole)
                .map(e => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
            </select>
          </div>

          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium text-sm mb-2">Asset Allocation</h4>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="form-input text-sm"
                placeholder="Uniform Details"
                value={form.assets.uniform}
                onChange={e =>
                  setForm({ ...form, assets: { ...form.assets, uniform: e.target.value } })
                }
              />
              <input
                className="form-input text-sm"
                placeholder="Tools of Work"
                value={form.assets.tools}
                onChange={e =>
                  setForm({ ...form, assets: { ...form.assets, tools: e.target.value } })
                }
              />
            </div>
          </div>

          {form.employeeId && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium text-sm mb-2">Import from Job Application (Optional)</h4>
              <select
                className="form-select text-sm mb-2"
                value={selectedApplication || ''}
                onChange={e => handleApplicationSelect(e.target.value)}
              >
                <option value="">Select Application</option>
                {applications
                  .filter(
                    a => a.email === employees.find(e => e.id === Number(form.employeeId))?.email
                  )
                  .map(a => (
                    <option key={a.id} value={a.id}>
                      {a.first_name} {a.last_name} — Job #{a.job_id}
                    </option>
                  ))}
              </select>
              {selectedApplication && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => importApplicationToEmployee(selectedApplication, form.employeeId)}
                  disabled={importing}
                >
                  {importing ? 'Importing...' : 'Import Application Data'}
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <Button variant="primary" size="sm" onClick={initiate}>
              Start
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowInitiate(false);
                setSelectedApplication(null);
                setForm({
                  employeeId: '',
                  department: '',
                  position: '',
                  probationMonths: 3,
                  supervisorRole: '',
                  supervisorId: '',
                  assets: { uniform: '', tools: '' },
                });
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : onboardings.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-slate-500">No onboardings.</div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {onboardings.map(o => {
            const emp = employees.find(e => e.id === o.employee_id) || {};
            const cnt = o.steps?.filter(s => s.completed).length || 0;
            return (
              <Card key={o.id}>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-semibold cursor-pointer hover:bg-orange-200"
                    onClick={() => navigate(`/admin/employees/${o.employee_id}`)}
                  >
                    {(emp.firstName || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3
                      className="font-bold cursor-pointer hover:text-orange-600"
                      onClick={() => navigate(`/admin/employees/${o.employee_id}`)}
                    >
                      {emp.firstName} {emp.lastName}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {o.department || emp.department} — {o.position || emp.position}
                    </p>
                  </div>
                  <span
                    className={
                      'px-2 py-0.5 rounded-full text-xs font-medium ' +
                      (o.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700')
                    }
                  >
                    {o.status}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: Math.round((cnt / 8) * 100) + '%' }}
                  />
                </div>
                <p className="text-xs text-slate-400 mb-3">{cnt}/8 steps</p>
                <div className="flex flex-wrap gap-2">
                  {STEPS.map(step => {
                    const isDone = getDone(o, step.name);
                    const Icon = step.icon;
                    const handleStepClick = () => {
                      if (isDone) return;
                      if (step.name.startsWith('probation_review')) {
                        addReview(o.id);
                      } else if (step.name === 'offer_letter') {
                        generateLetter(o.id);
                      } else if (step.name === 'documents') {
                        navigate('/admin/documents');
                      } else if (step.name === 'department_assignment') {
                        navigate(`/admin/employees/${o.employee_id}`);
                      } else if (step.name === 'asset_allocation') {
                        navigate('/admin/assets');
                      } else if (step.name === 'orientation') {
                        navigate('/admin/training');
                      } else {
                        completeStep(o.id, step.name);
                      }
                    };
                    return (
                      <button
                        key={step.name}
                        onClick={handleStepClick}
                        className={
                          'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ' +
                          (isDone
                            ? 'bg-green-50 text-green-700 cursor-default'
                            : 'bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary cursor-pointer')
                        }
                      >
                        <Icon size={12} />
                        {step.label}
                        {isDone && ' ✓'}
                      </button>
                    );
                  })}
                </div>
                {o.probationEndDate && (
                  <p className="text-xs text-slate-400 mt-2">
                    Probation ends: {new Date(o.probationEndDate).toLocaleDateString()}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {showReviewModal && (
        <Modal title="Probation Review" onClose={() => setShowReviewModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input w-full"
                value={reviewForm.score}
                onChange={e => setReviewForm({ ...reviewForm, score: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recommendation</label>
              <select
                className="form-select w-full"
                value={reviewForm.recommendation}
                onChange={e => setReviewForm({ ...reviewForm, recommendation: e.target.value })}
              >
                <option value="confirm">Confirm Employment</option>
                <option value="extend">Extend Probation</option>
                <option value="terminate">Terminate Employment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Comments</label>
              <textarea
                className="form-input w-full"
                rows="3"
                value={reviewForm.comments}
                onChange={e => setReviewForm({ ...reviewForm, comments: e.target.value })}
                placeholder="Provide feedback on performance..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowReviewModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={submitReview}>
                Submit Review
              </Button>
            </div>
          </div>
        </Modal>
      )}
      <PageInfoPanel
        title="Onboarding"
        description="Manage the 8-step new employee onboarding process"
        steps={[
          'Initiate onboarding from an accepted job application (Recruitment → Applications → Send Offer → Accept).',
          'Complete Step 1 (Offer Letter) — system generates and emails the offer with a secure token.',
          'Collect required documents: National ID, Certificates, KRA PIN, NSSF, NHIF.',
          'Assign the employee to their department and supervisor.',
          'Allocate company assets: laptop, uniform, tools, PPE.',
          'Schedule and complete orientation/training session.',
          'Conduct Mid-Probation Review (Step 6) and Final Probation Review (Step 7).',
          'Complete Step 8 (Confirm Employment) to activate full benefits and confirm the employee.',
        ]}
        faqs={[
          {
            q: 'How do I initiate onboarding without a job application?',
            a: 'Go to the employee record and click "Initiate Onboarding" to start the checklist manually.',
          },
          {
            q: 'What happens when onboarding is complete?',
            a: 'The employee status changes from "probation" to "confirmed" and full leave entitlements are activated.',
          },
          {
            q: 'Can steps be completed out of order?',
            a: 'Yes — steps can be checked off independently, but the system recommends completing them in sequence.',
          },
        ]}
        fetchStatus={async () => {
          const items = [];
          try {
            const res = await api.get('/api/onboarding').catch(() => ({ data: [] }));
            const records = Array.isArray(res.data) ? res.data : [];
            const incomplete = records.filter(
              r => r.status !== 'completed' && r.status !== 'confirmed'
            );
            if (incomplete.length > 0)
              items.push({
                level: 'warn',
                message: `${incomplete.length} employee${incomplete.length > 1 ? 's have' : ' has'} incomplete onboarding`,
                detail: 'Review their checklists and complete any pending steps.',
              });
            const overdueProbation = records.filter(
              r =>
                r.probation_end &&
                new Date(r.probation_end) < new Date() &&
                r.status !== 'completed'
            );
            if (overdueProbation.length > 0)
              items.push({
                level: 'error',
                message: `${overdueProbation.length} employee${overdueProbation.length > 1 ? 's are' : ' is'} past their probation end date`,
                detail: 'Complete the final probation review and confirm their employment.',
              });
            if (items.length === 0)
              items.push({ level: 'success', message: 'All onboarding records are up to date.' });
          } catch {
            items.push({
              level: 'info',
              message: 'Could not retrieve onboarding status. Ensure the backend is running.',
            });
          }
          return items;
        }}
      />
    </div>
  );

  return standalone ? <DashboardLayout>{content}</DashboardLayout> : content;
}
