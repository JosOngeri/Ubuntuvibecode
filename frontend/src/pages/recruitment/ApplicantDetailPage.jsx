import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api, { jobVerificationAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { 
  BsArrowLeft, BsPerson, BsBriefcase, BsEnvelope, BsTelephone, 
  BsFileText, BsCheckCircle, BsClock, BsBuilding, BsBoxArrowRight,
  BsCalendarCheck, BsStar, BsFileEarmark, BsDownload, BsEye,
  BsCheckCircleFill, BsCircle, BsChevronRight, BsShieldCheck
} from 'react-icons/bs';

const ONBOARDING_STEPS = [
  { 
    id: 'offer_letter', 
    label: 'Offer Letter', 
    icon: BsFileText,
    description: 'Generate and send offer letter to candidate',
    route: null, // handled via API
    action: 'generate-offer'
  },
  { 
    id: 'documents', 
    label: 'Documents', 
    icon: BsFileEarmark,
    description: 'Collect National ID, certificates, KRA PIN, NSSF, NHIF',
    route: '/admin/documents',
    action: 'navigate'
  },
  { 
    id: 'department_assignment', 
    label: 'Dept & Supervisor', 
    icon: BsBuilding,
    description: 'Assign department and supervisor',
    route: '/admin/employees',
    action: 'navigate'
  },
  { 
    id: 'asset_allocation', 
    label: 'Asset Allocation', 
    icon: BsBoxArrowRight,
    description: 'Allocate uniform, tools, laptop, PPE',
    route: '/admin/assets',
    action: 'navigate'
  },
  { 
    id: 'orientation', 
    label: 'Orientation', 
    icon: BsCalendarCheck,
    description: 'Schedule and complete orientation/training',
    route: '/admin/training',
    action: 'navigate'
  },
  { 
    id: 'probation_review_1', 
    label: 'Probation Review #1', 
    icon: BsStar,
    description: 'Mid-probation performance review',
    route: null,
    action: 'review'
  },
  { 
    id: 'probation_review_2', 
    label: 'Probation Review #2', 
    icon: BsStar,
    description: 'Final probation performance review',
    route: null,
    action: 'review'
  },
  { 
    id: 'confirmation', 
    label: 'Confirmation', 
    icon: BsCheckCircle,
    description: 'Confirm employment and activate full benefits',
    route: null,
    action: 'confirm'
  },
];

const ApplicantDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ score: 80, comments: '', recommendation: 'confirm' });
  const [verificationResults, setVerificationResults] = useState(null);
  const [managerRanking, setManagerRanking] = useState('');
  const [ownerApproved, setOwnerApproved] = useState(false);

  useEffect(() => {
    fetchApplicationDetail();
  }, [id]);

  const fetchApplicationDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/jobs/applications/${id}`);
      setApplication(res.data);
      
      // Check if there's an onboarding record for this applicant
      if (res.data?.applicantEmail) {
        try {
          const onboardingRes = await api.get('/onboarding');
          const onboardingRecords = onboardingRes.data || [];
          // Find onboarding by email match (if applicant was converted to employee)
          const matchedOnboarding = onboardingRecords.find(o => 
            o.employee_email === res.data.applicantEmail || 
            o.applicant_id === parseInt(id)
          );
          if (matchedOnboarding) {
            setOnboarding(matchedOnboarding);
            // Fetch employee details if onboarding exists
            if (matchedOnboarding.employee_id) {
              const empRes = await api.get(`/employees/${matchedOnboarding.employee_id}`);
              setEmployee(empRes.data);
            }
          }
        } catch (err) {
          console.log('No onboarding found for this applicant');
        }
      }
    } catch (err) {
      console.error('Failed to load application:', err);
      toast.error('Failed to load applicant details');
    } finally {
      setLoading(false);
    }
  };

  const getNextStep = () => {
    if (!onboarding) return null;
    const completedSteps = onboarding.steps?.filter(s => s.completed).map(s => s.name) || [];
    return ONBOARDING_STEPS.find(step => !completedSteps.includes(step.id));
  };

  const getStepStatus = (stepId) => {
    if (!onboarding) return 'pending';
    const step = onboarding.steps?.find(s => s.name === stepId);
    if (step?.completed) return 'completed';
    return 'pending';
  };

  const handleStepAction = async (step) => {
    if (!onboarding) {
      toast.info('Please initiate onboarding first');
      return;
    }

    switch (step.action) {
      case 'generate-offer':
        try {
          await api.post(`/onboarding/${onboarding.id}/offer-letter`);
          toast.success('Offer letter generated and sent');
          fetchApplicationDetail();
        } catch {
          toast.error('Failed to generate offer letter');
        }
        break;
      case 'navigate':
        if (step.route) {
          if (step.id === 'department_assignment' && employee?.id) {
            navigate(`${step.route}/${employee.id}`);
          } else {
            navigate(step.route);
          }
        }
        break;
      case 'review':
        setShowReviewModal(true);
        break;
      case 'confirm':
        handleCompleteStep(step.id);
        break;
      default:
        handleCompleteStep(step.id);
    }
  };

  const handleCompleteStep = async (stepId) => {
    try {
      await api.put(`/onboarding/${onboarding.id}/step`, { stepName: stepId });
      toast.success('Step completed');
      fetchApplicationDetail();
    } catch {
      toast.error('Failed to complete step');
    }
  };

  const submitReview = async () => {
    try {
      await api.post(`/onboarding/${onboarding.id}/review`, {
        score: parseInt(reviewForm.score),
        comments: reviewForm.comments,
        recommendation: reviewForm.recommendation
      });
      toast.success('Review submitted');
      setShowReviewModal(false);
      fetchApplicationDetail();
    } catch {
      toast.error('Failed to submit review');
    }
  };

  const initiateOnboarding = async () => {
    try {
      const res = await api.post('/onboarding', {
        applicantId: parseInt(id),
        firstName: application?.firstName || application?.applicantName?.split(' ')[0],
        lastName: application?.lastName || application?.applicantName?.split(' ')[1] || '',
        email: application?.applicantEmail,
        phone: application?.applicantPhone,
        department: application?.jobDepartment,
        position: application?.jobTitle,
        probationMonths: 3
      });
      toast.success('Onboarding initiated');
      setOnboarding(res.data);
      fetchApplicationDetail();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to initiate onboarding');
    }
  };

  const nextStep = getNextStep();

  const handleVerifyApplication = async () => {
    try {
      await jobVerificationAPI.verifyApplication(application.jobId, id);
      toast.success('Application verified successfully');
      fetchVerificationResults();
    } catch (err) {
      toast.error('Failed to verify application');
    }
  };

  const fetchVerificationResults = async () => {
    try {
      const res = await jobVerificationAPI.getVerificationResults(application.jobId, id);
      setVerificationResults(res.data);
    } catch (err) {
      console.error('Failed to fetch verification results');
    }
  };

  const handleUpdateManagerRanking = async () => {
    try {
      await jobVerificationAPI.updateManagerRanking(application.jobId, id, managerRanking);
      toast.success('Manager ranking updated');
    } catch (err) {
      toast.error('Failed to update manager ranking');
    }
  };

  const handleOwnerApproval = async (approved) => {
    try {
      await jobVerificationAPI.updateOwnerApproval(application.jobId, id, approved);
      setOwnerApproved(approved);
      toast.success(approved ? 'Owner approved' : 'Owner approval revoked');
    } catch (err) {
      toast.error('Failed to update owner approval');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-500">Loading applicant details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-500">Applicant not found</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <BsArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{application.applicantName}</h1>
            <p className="text-slate-500">Applicant ID: {id} | Status: <span className="font-medium text-blue-600">{application.status?.replace(/_/g, ' ')}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Applicant Info */}
          <div className="space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BsPerson className="text-orange-500" /> Applicant Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <BsEnvelope className="text-slate-400" />
                  <span className="text-slate-600">{application.applicantEmail}</span>
                </div>
                {application.applicantPhone && (
                  <div className="flex items-center gap-3 text-sm">
                    <BsTelephone className="text-slate-400" />
                    <span className="text-slate-600">{application.applicantPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <BsBriefcase className="text-slate-400" />
                  <span className="text-slate-600">{application.jobTitle || `Job #${application.jobId}`}</span>
                </div>
                {application.jobDepartment && (
                  <div className="flex items-center gap-3 text-sm">
                    <BsBuilding className="text-slate-400" />
                    <span className="text-slate-600">{application.jobDepartment}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Resume Card */}
            {application.cvPath && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <BsFileText className="text-orange-500" /> Documents
                </h3>
                <a
                  href={application.cvPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <BsDownload /> Download Resume
                </a>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/recruitment/jobs/${application.jobId}`)}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-700 flex items-center gap-2"
                >
                  <BsBriefcase /> View Job Posting
                </button>
                {application.status === 'shortlisted' && !onboarding && (
                  <button
                    onClick={initiateOnboarding}
                    className="w-full text-left px-4 py-2 rounded-lg hover:bg-green-50 text-sm text-green-700 flex items-center gap-2 font-medium"
                  >
                    <BsCheckCircle /> Initiate Onboarding
                  </button>
                )}
                {employee?.id && (
                  <button
                    onClick={() => navigate(`/admin/employees/${employee.id}`)}
                    className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-700 flex items-center gap-2"
                  >
                    <BsPerson /> View Employee Record
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Onboarding Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Onboarding Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <BsClock className="text-orange-500" /> 
                  {onboarding ? 'Onboarding Progress' : 'Next Steps'}
                </h3>
                {onboarding && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    onboarding.status === 'completed' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {onboarding.status}
                  </span>
                )}
              </div>

              {!onboarding ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 mb-4">No onboarding initiated yet</p>
                  {application.status === 'shortlisted' || application.status === 'offer_sent' ? (
                    <button
                      onClick={initiateOnboarding}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Start Onboarding Process
                    </button>
                  ) : (
                    <p className="text-sm text-slate-400">
                      Shortlist this applicant to begin onboarding
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                      <span>Progress</span>
                      <span>{onboarding.steps?.filter(s => s.completed).length || 0} / 8 steps</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all"
                        style={{width: `${((onboarding.steps?.filter(s => s.completed).length || 0) / 8) * 100}%`}}
                      />
                    </div>
                  </div>

                  {/* Next Step Highlight */}
                  {nextStep && onboarding.status !== 'completed' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                          <nextStep.icon size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-800 mb-1">Current Step</p>
                          <h4 className="font-semibold text-slate-900">{nextStep.label}</h4>
                          <p className="text-sm text-slate-600 mt-1">{nextStep.description}</p>
                          <button
                            onClick={() => handleStepAction(nextStep)}
                            className="mt-3 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                          >
                            Complete This Step <BsChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All Steps */}
                  <div className="space-y-2">
                    {ONBOARDING_STEPS.map((step, index) => {
                      const status = getStepStatus(step.id);
                      const isNext = nextStep?.id === step.id;
                      
                      return (
                        <div 
                          key={step.id}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            status === 'completed' 
                              ? 'bg-green-50' 
                              : isNext 
                                ? 'bg-orange-50 border border-orange-200' 
                                : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                            status === 'completed'
                              ? 'bg-green-500 text-white'
                              : isNext
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-200 text-slate-500'
                          }`}>
                            {status === 'completed' ? <BsCheckCircleFill /> : <step.icon size={14} />}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium text-sm ${
                              status === 'completed' ? 'text-green-700' : 'text-slate-900'
                            }`}>
                              {index + 1}. {step.label}
                            </p>
                            <p className="text-xs text-slate-500">{step.description}</p>
                          </div>
                          {status === 'completed' ? (
                            <span className="text-xs text-green-600 font-medium">Completed</span>
                          ) : isNext ? (
                            <button
                              onClick={() => handleStepAction(step)}
                              className="text-xs px-3 py-1 bg-orange-500 text-white rounded-full hover:bg-orange-600"
                            >
                              Do Now
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Pending</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Application Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Application Timeline</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Applied</p>
                    <p className="text-xs text-slate-500">
                      {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                {application.status !== 'pending' && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Status Updated</p>
                      <p className="text-xs text-slate-500">Changed to {application.status?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                )}
                {onboarding && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Onboarding Started</p>
                      <p className="text-xs text-slate-500">
                        {onboarding.created_at ? new Date(onboarding.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold text-lg mb-4">Probation Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={reviewForm.score}
                  onChange={(e) => setReviewForm({...reviewForm, score: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Recommendation</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={reviewForm.recommendation}
                  onChange={(e) => setReviewForm({...reviewForm, recommendation: e.target.value})}
                >
                  <option value="confirm">Confirm Employment</option>
                  <option value="extend">Extend Probation</option>
                  <option value="terminate">Terminate Employment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Comments</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows="3"
                  value={reviewForm.comments}
                  onChange={(e) => setReviewForm({...reviewForm, comments: e.target.value})}
                  placeholder="Provide feedback on performance..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReview}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ApplicantDetailPage;
