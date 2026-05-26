import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { BsArrowLeft, BsBriefcase, BsGeoAlt, BsClock, BsCalendarEvent, BsTag, BsFileEarmarkText, BsShare, BsCheckCircle, BsBuilding } from 'react-icons/bs';

export default function JobDescription() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      console.log('Fetching job with ID:', jobId);
      
      // Don't try to fetch fallback jobs
      if (String(jobId).startsWith('fallback')) {
        console.log('Skipping fetch for fallback job ID');
        setJob(null);
        setLoading(false);
        return;
      }
      
      try {
        const res = await api.get(`/jobs/public/${jobId}`);
        console.log('Job data response:', res.data);
        setJob(res.data);
      } catch (err) {
        console.error('Failed to fetch job details:', err);
        toast.error('Failed to fetch job details');
        setJob(null);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
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
      // Fallback: copy to clipboard
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
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(imageUrl).then(() => {
        toast.success('Advertisement link copied to clipboard!');
      }).catch(() => {
        toast.error('Failed to copy link');
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">Loading...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <Card>
            <p className="text-center text-slate-500">Job posting not found</p>
            <div className="text-center mt-4">
              <Link to="/recruitment/jobs-board" className="text-[#CB7246] hover:underline">Back to Job Board</Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const isDeadlinePassed = job.applicationDeadline && new Date(job.applicationDeadline) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/recruitment/jobs-board"
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <BsArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold">Job Details</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Main Job Card */}
        <Card>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-[#CB7246]/10 rounded-lg">
              <BsBriefcase size={32} className="text-[#CB7246]" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">{job.title}</h2>
              <div className="flex items-center gap-4 mt-2 text-slate-600">
                <span className="flex items-center gap-1">
                  <BsGeoAlt size={14} />
                  {job.location || 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <BsBuilding size={14} />
                  {job.department || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-slate-200">
            {/* Employment Type */}
            <div>
              <label className="text-sm font-medium text-slate-600">Employment Type</label>
              <p className="text-lg font-semibold mt-1">{job.employmentType || 'N/A'}</p>
            </div>

            {/* Application Deadline */}
            <div>
              <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <BsCalendarEvent size={14} />
                Application Deadline
              </label>
              <p className={`text-lg font-semibold mt-1 ${isDeadlinePassed ? 'text-red-600' : ''}`}>
                {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Open until filled'}
                {isDeadlinePassed && <span className="text-red-600 text-sm ml-2">(Closed)</span>}
              </p>
            </div>

            {/* Posted At */}
            <div>
              <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <BsClock size={14} />
                Posted At
              </label>
              <p className="text-lg font-semibold mt-1">
                {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <BsGeoAlt size={14} />
                Location
              </label>
              <p className="text-lg font-semibold mt-1">{job.location || 'N/A'}</p>
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <div className="mb-6 pb-6 border-b border-slate-200">
              <label className="text-sm font-medium text-slate-600 flex items-center gap-2 mb-2">
                <BsFileEarmarkText size={14} />
                Job Description
              </label>
              <p className="text-slate-700 whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div className="mb-6 pb-6 border-b border-slate-200">
              <label className="text-sm font-medium text-slate-600 mb-2 block">Requirements</label>
              <p className="text-slate-700 whitespace-pre-wrap">{job.requirements}</p>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && (
            <div className="mb-6 pb-6 border-b border-slate-200">
              <label className="text-sm font-medium text-slate-600 mb-2 block">Responsibilities</label>
              <p className="text-slate-700 whitespace-pre-wrap">{job.responsibilities}</p>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && (
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-600 mb-2 block">Benefits</label>
              <p className="text-slate-700 whitespace-pre-wrap">{job.benefits}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-200">
            <Button
              variant="primary"
              onClick={() => navigate(`/recruitment/apply/${jobId}`)}
              disabled={isDeadlinePassed}
            >
              {isDeadlinePassed ? 'Application Closed' : 'Apply Now'}
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
              variant="outline"
              onClick={() => navigate('/recruitment/jobs-board')}
            >
              Back to Jobs
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
