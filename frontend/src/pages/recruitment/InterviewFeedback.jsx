import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { BsBriefcase, BsPerson, BsPlus, BsTrash, BsCheckCircle } from 'react-icons/bs';

export default function InterviewFeedback() {
  const { appId, token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [job, setJob] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [comments, setComments] = useState('');
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewerEmail, setInterviewerEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch application details
        const appRes = await api.get(`/jobs/applications/${appId}/interview-feedback/${token}`);
        setApplication(appRes.data);

        // Fetch job details to get requirements
        if (appRes.data.jobId) {
          const jobRes = await api.get(`/jobs/public/${appRes.data.jobId}`);
          setJob(jobRes.data);

          // Auto-populate metrics from job requirements
          const requirements = jobRes.data.requirements || '';
          const requirementList = requirements.split('\n').filter(r => r.trim());
          
          const initialMetrics = requirementList.map((req, idx) => ({
            id: idx,
            name: req.trim(),
            score: 0,
          }));

          // Add custom metrics from invitation if any
          const invitations = appRes.data.interviewInvitations || [];
          const invite = invitations.find(inv => inv.mainToken === token);
          if (invite && invite.customMetrics) {
            invite.customMetrics.forEach((cm, idx) => {
              initialMetrics.push({
                id: initialMetrics.length + idx,
                name: cm,
                score: 0,
              });
            });
          }

          setMetrics(initialMetrics);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        toast.error('Failed to load interview feedback form');
        navigate('/recruitment/jobs-board');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appId, token, navigate]);

  const addMetric = () => {
    setMetrics([...metrics, { id: Date.now(), name: '', score: 0 }]);
  };

  const removeMetric = (id) => {
    setMetrics(metrics.filter(m => m.id !== id));
  };

  const updateMetric = (id, field, value) => {
    setMetrics(metrics.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const calculateOverallGrade = () => {
    if (metrics.length === 0) return 0;
    const totalScore = metrics.reduce((sum, m) => sum + (m.score || 0), 0);
    return (totalScore / metrics.length).toFixed(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!interviewerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!interviewerEmail.trim()) {
      toast.error('Please enter your email');
      return;
    }

    const validMetrics = metrics.filter(m => m.name.trim());
    if (validMetrics.length === 0) {
      toast.error('Please add at least one metric');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/jobs/applications/${appId}/interview-feedback/${token}`, {
        interviewerName,
        interviewerEmail,
        metrics: validMetrics,
        comments,
      });
      toast.success('Interview feedback submitted successfully');
      navigate('/recruitment/jobs-board');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">Loading...</div>
      </div>
    );
  }

  if (!application || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <Card>
            <p className="text-center text-slate-500">Invalid interview link</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-xl font-bold">Interview Feedback</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Job Information */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#CB7246]/10 rounded-lg">
              <BsBriefcase size={32} className="text-[#CB7246]" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">{job.title}</h2>
              <p className="text-slate-600 mt-1">Applicant: {application.applicantName}</p>
            </div>
          </div>
        </Card>

        {/* Interviewer Information */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Your Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                <BsPerson size={14} className="inline mr-1" />
                Your Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB7246]"
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                <BsPerson size={14} className="inline mr-1" />
                Your Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB7246]"
                value={interviewerEmail}
                onChange={(e) => setInterviewerEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
          </div>
        </Card>

        {/* Evaluation Metrics */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Evaluation Metrics</h3>
            <Button size="sm" variant="outline" onClick={addMetric}>
              <BsPlus size={16} className="mr-1" />
              Add Metric
            </Button>
          </div>
          
          <div className="space-y-4">
            {metrics.map((metric) => (
              <div key={metric.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB7246] mb-2"
                    value={metric.name}
                    onChange={(e) => updateMetric(metric.id, 'name', e.target.value)}
                    placeholder="Metric name"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">Score (0-100):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB7246]"
                      value={metric.score}
                      onChange={(e) => updateMetric(metric.id, 'score', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => removeMetric(metric.id)}
                >
                  <BsTrash size={16} />
                </Button>
              </div>
            ))}
          </div>

          {metrics.length === 0 && (
            <p className="text-center text-slate-500 py-4">No metrics added. Click "Add Metric" to begin.</p>
          )}
        </Card>

        {/* Overall Grade */}
        {metrics.length > 0 && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Overall Grade</h3>
                <p className="text-sm text-slate-600">Average of all metric scores</p>
              </div>
              <div className="text-3xl font-bold text-[#CB7246]">
                {calculateOverallGrade()}/100
              </div>
            </div>
          </Card>
        )}

        {/* Comments */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Interviewer Comments</h3>
          <textarea
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB7246]"
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add your comments about the candidate..."
          />
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : (
              <>
                <BsCheckCircle size={16} className="mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
