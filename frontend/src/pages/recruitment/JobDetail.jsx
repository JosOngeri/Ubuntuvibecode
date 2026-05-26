import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { BsArrowLeft, BsBriefcase, BsGeoAlt, BsClock, BsCalendarEvent, BsTag, BsFileEarmarkText, BsShare, BsPerson, BsTelephone, BsEnvelope, BsCheckCircle } from 'react-icons/bs';

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/jobs/${jobId}`).catch(() => ({ data: null }));
        setJob(res.data);
      } catch (err) {
        console.error('Failed to fetch job details:', err);
        toast.error('Failed to fetch job details');
        navigate('/recruitment/jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId, navigate]);

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;

    api.delete(`/jobs/${jobId}`)
      .then(() => {
        toast.success('Job posting deleted successfully');
        navigate('/recruitment/jobs');
      })
      .catch(() => {
        toast.error('Failed to delete job posting');
      });
  };

  const handleViewApplicants = () => {
    navigate(`/recruitment/jobs/${jobId}/applicants`);
  };

  const handleExtendDeadline = async () => {
    try {
      await api.put(`/jobs/${jobId}/extend-deadline`, { newDeadline });
      toast.success('Application deadline extended successfully');
      setShowExtendModal(false);
      setNewDeadline('');
      const res = await api.get(`/jobs/${jobId}`).catch(() => ({ data: null }));
      setJob(res.data);
    } catch (err) {
      console.error('Failed to extend deadline:', err);
      toast.error('Failed to extend deadline');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/recruitment/job/${jobId}`;
    const shareText = `Check out this job opening: ${job?.title} at Ubuntu Ecolodge`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share canceled or failed:', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('Link copied to clipboard!');
      }).catch(() => {
        toast.error('Failed to copy link');
      });
    }
  };

  const handleShareAdvertisement = async () => {
    if (!job.advertisement_image_path) {
      toast.error('Advertisement image not available');
      return;
    }

    const imageUrl = `${window.location.origin}${job.advertisement_image_path}`;
    const shareText = `Check out this job opening: ${job?.title} at Ubuntu Ecolodge`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title,
          text: shareText,
          url: imageUrl
        });
      } catch (err) {
        console.log('Share canceled or failed:', err);
      }
    } else {
      navigator.clipboard.writeText(imageUrl).then(() => {
        toast.success('Advertisement link copied to clipboard!');
      }).catch(() => {
        toast.error('Failed to copy link');
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Card>
            <p className="text-center text-slate-500">Job posting not found</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadgeColor = (status) => {
    const colors = {
      open: 'bg-green-100 text-green-800',
      closed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const isDeadlinePassed = job.applicationDeadline && new Date(job.applicationDeadline) < new Date();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/recruitment/jobs')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <BsArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold">Job Details</h1>
          </div>
        </div>

        {/* Main Job Card */}
        <Card>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-primary-50 rounded-lg">
              <BsBriefcase size={32} className="text-primary-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{job.title}</h2>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-slate-600">
                <span className="flex items-center gap-1">
                  <BsGeoAlt size={14} />
                  {job.location || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
            {/* Department */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Department</label>
              <p className="text-lg font-semibold mt-1">{job.department || 'N/A'}</p>
            </div>

            {/* Career Level */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Career Level</label>
              <p className="text-lg font-semibold mt-1">{job.careerLevel || 'N/A'}</p>
            </div>

            {/* Employment Type */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Employment Type</label>
              <p className="text-lg font-semibold mt-1">{job.employmentType || 'N/A'}</p>
            </div>

            {/* Salary Range */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsTag size={14} />
                Salary Range
              </label>
              <p className="text-lg font-semibold mt-1">{job.salaryRange || 'N/A'}</p>
            </div>

            {/* Application Deadline */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsCalendarEvent size={14} />
                Application Deadline
              </label>
              <div className="flex items-center gap-2 mt-1">
                <p className={`text-lg font-semibold ${isDeadlinePassed ? 'text-red-600' : ''}`}>
                  {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'N/A'}
                  {isDeadlinePassed && <span className="text-red-600 text-sm ml-2">(Passed)</span>}
                </p>
                <Button size="xs" variant="outline" onClick={() => { setShowExtendModal(true); setNewDeadline(job.applicationDeadline || ''); }}>
                  Extend
                </Button>
              </div>
            </div>

            {/* Posted At */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsClock size={14} />
                Posted At
              </label>
              <p className="text-lg font-semibold mt-1">
                {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsGeoAlt size={14} />
                Location
              </label>
              <p className="text-lg font-semibold mt-1">{job.location || 'N/A'}</p>
            </div>

            {/* Contact Person */}
            {job.contactPerson && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <BsPerson size={14} />
                  Contact Person
                </label>
                <p className="text-lg font-semibold mt-1">{job.contactPerson}</p>
              </div>
            )}

            {/* Contact Phone */}
            {job.contactPhone && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <BsTelephone size={14} />
                  Contact Phone
                </label>
                <p className="text-lg font-semibold mt-1">{job.contactPhone}</p>
              </div>
            )}

            {/* Contact Email */}
            {job.contactEmail && (
              <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsEnvelope size={14} />
                Contact Email
              </label>
              <p className="text-lg font-semibold mt-1">{job.contactEmail}</p>
            </div>
            )}
          </div>

          {/* Introduction */}
          {job.description && (
            <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <BsFileEarmarkText size={18} />
                Introduction
              </h3>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {/* Your Responsibilities */}
          {job.responsibilities && (
            <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <BsCheckCircle size={18} />
                Your Responsibilities
              </h3>
              <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {job.responsibilities}
              </div>
            </div>
          )}

          {/* Required Skills and Experience */}
          {job.requirements && (
            <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <BsPerson size={18} />
                Required Skills and Experience
              </h3>
              <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {job.requirements}
              </div>
            </div>
          )}

          {/* Key Job Listing Details */}
          <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">Key Job Listing Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {job.workSchedule && (
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Work Schedule</label>
                  <p className="text-slate-800 dark:text-slate-200 mt-1">{job.workSchedule}</p>
                </div>
              )}
              {job.requiredLanguages && (
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Required Languages</label>
                  <p className="text-slate-800 dark:text-slate-200 mt-1">{job.requiredLanguages}</p>
                </div>
              )}
              {job.experienceLevel && (
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Experience Level</label>
                  <p className="text-slate-800 dark:text-slate-200 mt-1">{job.experienceLevel}</p>
                </div>
              )}
              {job.educationRequirements && (
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Education Requirements</label>
                  <p className="text-slate-800 dark:text-slate-200 mt-1">{job.educationRequirements}</p>
                </div>
              )}
            </div>
          </div>

          {/* Benefits */}
          {job.benefits && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <BsCheckCircle size={18} />
                Benefits
              </h3>
              <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {job.benefits}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={() => navigate('/recruitment/jobs')}
            >
              Back to Jobs
            </Button>
            <Button
              variant="primary"
              onClick={handleViewApplicants}
            >
              View Applicants
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
            >
              <BsShare size={16} className="mr-2" />
              Share Job
            </Button>
            {job.advertisement_image_path && (
              <Button
                variant="outline"
                onClick={handleShareAdvertisement}
              >
                <BsShare size={16} className="mr-2" />
                Share Advertisement
              </Button>
            )}
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Delete Job
            </Button>
          </div>
        </Card>

        <Modal isOpen={showExtendModal} onClose={() => setShowExtendModal(false)} title="Extend Application Deadline">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Deadline</label>
              <p className="text-slate-600">{job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Not set'}</p>
            </div>
            <div className="form-group">
              <label>New Deadline</label>
              <input
                type="date"
                className="form-input"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="primary" onClick={handleExtendDeadline}>Extend Deadline</Button>
              <Button variant="outline" onClick={() => setShowExtendModal(false)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
