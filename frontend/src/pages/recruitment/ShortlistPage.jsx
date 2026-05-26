import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { BsPerson, BsBriefcase, BsStar, BsEnvelope, BsCalendar, BsListCheck, BsTrophy, BsChat, BsPlus, BsTrash, BsSearch } from 'react-icons/bs'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  shortlisted: { label: 'Shortlisted', cls: 'bg-blue-100 text-blue-800' },
  interview_scheduled: { label: 'Interview Scheduled', cls: 'bg-purple-100 text-purple-800' },
  interview_completed: { label: 'Interview Completed', cls: 'bg-indigo-100 text-indigo-800' },
  offer_sent: { label: 'Offer Sent', cls: 'bg-yellow-100 text-yellow-800' },
  hired: { label: 'Hired', cls: 'bg-green-100 text-green-800' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_LABELS[status] || { label: status, cls: 'bg-slate-100 text-slate-700' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
}

function ScoreBar({ score, max = 10 }) {
  const pct = score != null ? Math.min(100, (score / max) * 100) : 0
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right">{score != null ? Number(score).toFixed(1) : '—'}</span>
    </div>
  )
}

// ─── Interview Invite Modal ────────────────────────────────────────────────────

function InterviewInviteModal({ app, onClose, onSuccess }) {
  const [emails, setEmails] = useState([''])
  const [interviewDate, setInterviewDate] = useState('')
  const [metrics, setMetrics] = useState([
    { name: 'Communication', maxScore: 10 },
    { name: 'Technical Knowledge', maxScore: 10 },
    { name: 'Problem Solving', maxScore: 10 },
    { name: 'Cultural Fit', maxScore: 10 },
  ])
  const [submitting, setSubmitting] = useState(false)

  const addEmail = () => setEmails([...emails, ''])
  const removeEmail = (i) => setEmails(emails.filter((_, idx) => idx !== i))
  const updateEmail = (i, v) => setEmails(emails.map((e, idx) => idx === i ? v : e))

  const addMetric = () => setMetrics([...metrics, { name: '', maxScore: 10 }])
  const removeMetric = (i) => setMetrics(metrics.filter((_, idx) => idx !== i))
  const updateMetric = (i, field, v) => setMetrics(metrics.map((m, idx) => idx === i ? { ...m, [field]: v } : m))

  const handleSubmit = async () => {
    const validEmails = emails.filter(e => e.trim())
    if (!validEmails.length) { toast.error('Add at least one interviewer email'); return }
    setSubmitting(true)
    try {
      await api.post(`/jobs/applications/${app.id}/interview-invite`, {
        interviewerEmails: validEmails,
        interviewDate: interviewDate || null,
        customMetrics: metrics.filter(m => m.name.trim()),
      })
      toast.success('Interview invitations sent')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to send invitations')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={`Interview Invite — ${app.applicantName}`}>
      <div className="space-y-5 p-1">
        <div>
          <label className="block text-sm font-semibold mb-1">Interview Date</label>
          <input
            type="datetime-local"
            className="form-input w-full"
            value={interviewDate}
            onChange={e => setInterviewDate(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold">Panelist Emails</label>
            <button type="button" onClick={addEmail} className="text-[#CB7246] text-sm flex items-center gap-1 hover:underline">
              <BsPlus /> Add
            </button>
          </div>
          {emails.map((email, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="email"
                className="form-input flex-1"
                placeholder="interviewer@example.com"
                value={email}
                onChange={e => updateEmail(i, e.target.value)}
              />
              {emails.length > 1 && (
                <button type="button" onClick={() => removeEmail(i)} className="text-red-500 hover:text-red-700 p-2">
                  <BsTrash />
                </button>
              )}
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold">Scoring Metrics</label>
            <button type="button" onClick={addMetric} className="text-[#CB7246] text-sm flex items-center gap-1 hover:underline">
              <BsPlus /> Add
            </button>
          </div>
          {metrics.map((m, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center">
              <input
                className="form-input flex-1"
                placeholder="Metric name"
                value={m.name}
                onChange={e => updateMetric(i, 'name', e.target.value)}
              />
              <input
                type="number"
                min="1"
                max="100"
                className="form-input w-20"
                value={m.maxScore}
                onChange={e => updateMetric(i, 'maxScore', Number(e.target.value))}
              />
              <button type="button" onClick={() => removeMetric(i)} className="text-red-500 hover:text-red-700 p-2">
                <BsTrash />
              </button>
            </div>
          ))}
          <p className="text-xs text-slate-400 mt-1">Each metric is scored out of its max score by the interviewer.</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Sending…' : 'Send Invitations'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Interview Score Modal ─────────────────────────────────────────────────────

function InterviewScoreModal({ app, onClose, onSuccess }) {
  const [score, setScore] = useState(app.interviewScore ?? '')
  const [notes, setNotes] = useState(app.interviewNotes ?? '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (score === '' || isNaN(Number(score))) { toast.error('Enter a valid score'); return }
    setSubmitting(true)
    try {
      await api.put(`/jobs/applications/${app.id}/interview-score`, { score: Number(score), notes })
      toast.success('Interview score saved')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to save score')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={`Score Interview — ${app.applicantName}`}>
      <div className="space-y-4 p-1">
        <div>
          <label className="block text-sm font-semibold mb-1">Overall Interview Score (0–10)</label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            className="form-input w-full"
            value={score}
            onChange={e => setScore(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Notes</label>
          <textarea
            className="form-input w-full"
            rows={4}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Interview observations, strengths, concerns…"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Score'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Interview Detail Modal ────────────────────────────────────────────────────

function InterviewDetailModal({ appId, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/jobs/applications/${appId}/interview-detail`)
      .then(r => setDetail(r.data))
      .catch(() => toast.error('Failed to load interview detail'))
      .finally(() => setLoading(false))
  }, [appId])

  const feedbacks = detail?.interviewSummary?.feedbacks || []
  const avg = detail?.interviewSummary?.averageOverallGrade
  const metricAvgs = detail?.interviewSummary?.metricAverages || {}
  const allMetrics = feedbacks.length > 0 ? Object.keys(feedbacks[0].metrics?.reduce((acc, m) => ({ ...acc, [m.name]: true }), {}) || {}) : Object.keys(metricAvgs)

  return (
    <Modal isOpen onClose={onClose} title={`Interview Detail — ${detail?.applicantName || '…'}`}>
      <div className="space-y-5 p-1 max-h-[70vh] overflow-y-auto">
        {loading && <p className="text-center text-slate-400 py-8">Loading…</p>}
        {!loading && detail && (
          <>
            {/* Summary card */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Avg. Score</p>
                  <p className="text-3xl font-bold text-[#CB7246]">{avg != null ? Number(avg).toFixed(2) : '—'}<span className="text-base text-slate-400">/10</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Feedback Rounds</p>
                  <p className="text-2xl font-bold text-slate-700">{feedbacks.length}</p>
                </div>
              </div>
            </div>

            {/* Metric averages */}
            {Object.keys(metricAvgs).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Metric Averages (across all panelists)</h4>
                <div className="space-y-2">
                  {Object.entries(metricAvgs).map(([name, avg]) => (
                    <div key={name}>
                      <div className="flex justify-between text-xs text-slate-600 mb-0.5">
                        <span>{name}</span>
                        <span>{Number(avg).toFixed(2)}/10</span>
                      </div>
                      <ScoreBar score={avg} max={10} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per-panelist feedback table */}
            {feedbacks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Panelist Feedback</h4>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-3 py-2 font-semibold text-slate-600">Panelist</th>
                        {allMetrics.map(m => <th key={m} className="px-3 py-2 font-semibold text-slate-600 text-center">{m}</th>)}
                        <th className="px-3 py-2 font-semibold text-slate-600 text-center">Overall</th>
                        <th className="px-3 py-2 font-semibold text-slate-600">Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbacks.map((fb, i) => {
                        const metricMap = {}
                        ;(fb.metrics || []).forEach(m => { metricMap[m.name] = m.score })
                        return (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-3 py-2">
                              <div className="font-medium">{fb.interviewerName}</div>
                              <div className="text-xs text-slate-400">{fb.interviewerEmail}</div>
                            </td>
                            {allMetrics.map(m => (
                              <td key={m} className="px-3 py-2 text-center">{metricMap[m] != null ? metricMap[m] : '—'}</td>
                            ))}
                            <td className="px-3 py-2 text-center font-semibold text-[#CB7246]">
                              {fb.overallGrade != null ? Number(fb.overallGrade).toFixed(1) : '—'}
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-500 max-w-xs truncate">{fb.comments || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {feedbacks.length === 0 && (
              <p className="text-center text-slate-400 py-4 text-sm">No interview feedback submitted yet.</p>
            )}

            {/* Overall manual score */}
            {detail.interviewScore != null && (
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Manager's Overall Score</p>
                <ScoreBar score={detail.interviewScore} max={10} />
                {detail.interviewNotes && <p className="text-sm text-slate-600 mt-2">{detail.interviewNotes}</p>}
              </div>
            )}
          </>
        )}
        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ShortlistPage() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('shortlist')
  const [search, setSearch] = useState('')
  const [jobFilter, setJobFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals
  const [inviteApp, setInviteApp] = useState(null)
  const [scoreApp, setScoreApp] = useState(null)
  const [detailAppId, setDetailAppId] = useState(null)

  const fetchShortlisted = async () => {
    setLoading(true)
    try {
      const res = await api.get('/jobs/applications/shortlisted/all')
      setApplications(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      toast.error('Failed to load shortlisted candidates')
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchShortlisted() }, [])

  // Unique job titles for filter dropdown
  const jobTitles = [...new Set(applications.map(a => a.jobTitle).filter(Boolean))]

  const filtered = applications.filter(a => {
    const matchSearch = !search || [a.applicantName, a.applicantEmail, a.jobTitle].some(v => (v || '').toLowerCase().includes(search.toLowerCase()))
    const matchJob = jobFilter === 'all' || a.jobTitle === jobFilter
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchJob && matchStatus
  })

  // Scoreboard: sorted by interviewScore desc
  const scoreboard = [...applications]
    .filter(a => a.interviewScore != null)
    .sort((a, b) => (b.interviewScore || 0) - (a.interviewScore || 0))

  // Interview management: applications with invitations
  const withInvitations = applications.filter(a => a.interviewInvitations?.length > 0)

  const TABS = [
    { id: 'shortlist', label: 'Shortlist', icon: BsListCheck },
    { id: 'scoreboard', label: 'Scoreboard', icon: BsTrophy },
    { id: 'interviews', label: 'Interview Management', icon: BsCalendar },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Shortlist & Interview Board</h1>
            <p className="text-slate-500 text-sm mt-1">Cross-job view of shortlisted candidates and the full interview workflow</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{applications.length} shortlisted</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#CB7246] text-[#CB7246]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon /> {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Shortlist ── */}
        {activeTab === 'shortlist' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="form-input pl-9 w-full"
                  placeholder="Search by name, email, job…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select className="form-input" value={jobFilter} onChange={e => setJobFilter(e.target.value)}>
                <option value="all">All Jobs</option>
                {jobTitles.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <Card>
              {loading ? (
                <div className="py-12 text-center text-slate-400">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <BsPerson size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No shortlisted candidates</p>
                  <p className="text-sm mt-1">Shortlist applicants from the Applicant Review Dashboard</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Candidate</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Job</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 w-40">Interview Score</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filtered.map(app => (
                        <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800 dark:text-slate-100">{app.applicantName}</div>
                            <div className="text-xs text-slate-400">{app.applicantEmail}</div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigate(`/recruitment/jobs/${app.jobId}`)}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {app.jobTitle || '—'}
                            </button>
                            <div className="text-xs text-slate-400">ID: {app.jobId}</div>
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                          <td className="px-4 py-3"><ScoreBar score={app.interviewScore} /></td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 justify-end flex-wrap">
                              <Button size="sm" variant="outline" onClick={() => setInviteApp(app)}>
                                <BsEnvelope className="inline mr-1" />Invite
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setScoreApp(app)}>
                                <BsStar className="inline mr-1" />Score
                              </Button>
                              <Button size="sm" variant="primary" onClick={() => setDetailAppId(app.id)}>
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── TAB: Scoreboard ── */}
        {activeTab === 'scoreboard' && (
          <Card>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><BsTrophy className="text-[#CB7246]" /> Interview Scoreboard</h2>
            {scoreboard.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <BsTrophy size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No scored interviews yet</p>
                <p className="text-sm mt-1">Use the Shortlist tab to assign scores after interviews</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Rank</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Candidate</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Job Title</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 w-48">Score</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Feedback Rounds</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scoreboard.map((app, idx) => (
                      <tr key={app.id} className={`hover:bg-slate-50 transition-colors ${idx === 0 ? 'bg-yellow-50' : idx === 1 ? 'bg-slate-50' : ''}`}>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm ${
                            idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-slate-400 text-white' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>{idx + 1}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{app.applicantName}</div>
                          <div className="text-xs text-slate-400">{app.applicantEmail}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{app.jobTitle || '—'}</td>
                        <td className="px-4 py-3"><ScoreBar score={app.interviewScore} /></td>
                        <td className="px-4 py-3 text-center">{app.interviewFeedbacks?.length || 0}</td>
                        <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="primary" onClick={() => setDetailAppId(app.id)}>Details</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* ── TAB: Interview Management ── */}
        {activeTab === 'interviews' && (
          <div className="space-y-4">
            {withInvitations.length === 0 ? (
              <Card>
                <div className="py-12 text-center text-slate-400">
                  <BsCalendar size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No interviews scheduled</p>
                  <p className="text-sm mt-1">Use the Shortlist tab to send interview invitations</p>
                </div>
              </Card>
            ) : (
              withInvitations.map(app => {
                const invitations = app.interviewInvitations || []
                const feedbacks = app.interviewFeedbacks || []
                return (
                  <Card key={app.id}>
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800">{app.applicantName}</h3>
                          <StatusBadge status={app.status} />
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{app.jobTitle} <span className="text-slate-300">·</span> ID {app.jobId}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setInviteApp(app)}>
                          <BsEnvelope className="inline mr-1" />Resend Invite
                        </Button>
                        <Button size="sm" variant="primary" onClick={() => setDetailAppId(app.id)}>
                          <BsChat className="inline mr-1" />View Feedback
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {invitations.map((inv, i) => (
                        <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Round {i + 1}</span>
                            <span className="text-xs text-slate-400">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}</span>
                          </div>
                          <div className="space-y-1">
                            {(inv.invitations || []).map((panelist, j) => {
                              const hasFeedback = feedbacks.some(f => f.interviewerEmail === panelist.email)
                              return (
                                <div key={j} className="flex items-center justify-between text-sm">
                                  <span className="text-slate-700">{panelist.email}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${hasFeedback ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {hasFeedback ? '✓ Submitted' : 'Pending'}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                          {inv.customMetrics?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-200">
                              <p className="text-xs text-slate-400">Metrics: {inv.customMetrics.map(m => m.name).join(', ')}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {feedbacks.length > 0 && (
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-sm text-slate-500">{feedbacks.length} feedback{feedbacks.length > 1 ? 's' : ''} received</span>
                        <ScoreBar score={app.interviewScore} />
                      </div>
                    )}
                  </Card>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {inviteApp && (
        <InterviewInviteModal app={inviteApp} onClose={() => setInviteApp(null)} onSuccess={fetchShortlisted} />
      )}
      {scoreApp && (
        <InterviewScoreModal app={scoreApp} onClose={() => setScoreApp(null)} onSuccess={fetchShortlisted} />
      )}
      {detailAppId && (
        <InterviewDetailModal appId={detailAppId} onClose={() => setDetailAppId(null)} />
      )}
    </DashboardLayout>
  )
}
