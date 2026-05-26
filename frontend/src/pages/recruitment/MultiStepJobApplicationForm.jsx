import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import DateInput from '../../components/common/DateInput'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useSettings } from '../../contexts/SettingsContext'
import { getAllInstitutions, getInstitutionType } from '../../data/kuccpsInstitutions'

const STEPS = [
  { id: 1, title: 'Personal Details', description: 'Basic information about yourself' },
  { id: 2, title: 'Education', description: 'Academic qualifications and institutions' },
  { id: 3, title: 'Employment History', description: 'Previous work experience' },
  { id: 4, title: 'Certifications & Licenses', description: 'Professional certifications' },
  { id: 5, title: 'Attachments', description: 'Upload your CV and supporting documents' },
  { id: 6, title: 'Disclosures', description: 'Experience, availability, and work authorization' },
  { id: 7, title: 'Declaration', description: 'Confirm and submit your application' },
]

const emptyWork = { employer: '', jobTitle: '', isCurrentJob: false, startDate: '', endDate: '', achievements: '' }
const emptyEdu = { institution: '', program: '', educationLevel: '', startYear: '', endYear: '' }
const emptyCert = { name: '', issuingOrganization: '', certificateNumber: '', issuingDate: '', expiryDate: '', noExpiry: false }

export default function MultiStepJobApplicationForm() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { getDepartments, getEmploymentTypes, getEmploymentStatus } = useSettings()

  const [currentStep, setCurrentStep] = useState(1)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState({})
  const draftLoaded = useRef(false)

  const departments = getDepartments()
  const employmentTypes = getEmploymentTypes()
  const employmentStatus = getEmploymentStatus()
  const institutions = getAllInstitutions()

  const [form, setForm] = useState({
    // Step 1: Personal Details
    surname: '',
    firstName: '',
    otherNames: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    nationality: '',
    nationalId: '',
    phone: '',
    email: '',

    // Step 2: Education
    education: [],

    // Step 3: Employment History
    employmentHistory: [],

    // Step 4: Certifications & Licenses
    certifications: [],

    // Step 5: Attachments
    cv: null,
    coverLetterFile: null,
    otherDocuments: [],

    // Step 6: Disclosures
    experienceYears: '',
    availabilityWeeks: '',
    rightToWork: '',
    salaryExpectation: '',

    // Step 7: Declaration
    declarationConfirmed: false,
    privacyPolicyConfirmed: false,
    signature: '',
  })

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/jobs/public/list`).catch(() => ({ data: [] }))
        const matched = (res.data || []).find(item => String(item.id) === String(jobId))
        setJob(matched || null)
      } catch { setJob(null) }
      setLoading(false)
    })()
  }, [jobId])

  useEffect(() => {
    // Load draft from localStorage for this specific job (only once)
    if (draftLoaded.current) return

    const saved = localStorage.getItem(`jobApplication_${jobId}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setForm(parsed)
        draftLoaded.current = true
      } catch { }
    } else {
      // Load saved personal information from previous applications
      const savedPersonalInfo = localStorage.getItem('applicantPersonalInfo')
      if (savedPersonalInfo) {
        try {
          const personalInfo = JSON.parse(savedPersonalInfo)
          setForm(prev => ({
            ...prev,
            surname: personalInfo.surname || prev.surname,
            firstName: personalInfo.firstName || prev.firstName,
            otherNames: personalInfo.otherNames || prev.otherNames,
            dateOfBirth: personalInfo.dateOfBirth || prev.dateOfBirth,
            gender: personalInfo.gender || prev.gender,
            maritalStatus: personalInfo.maritalStatus || prev.maritalStatus,
            nationality: personalInfo.nationality || prev.nationality,
            nationalId: personalInfo.nationalId || prev.nationalId,
            phone: personalInfo.phone || prev.phone,
            email: personalInfo.email || prev.email,
            address: personalInfo.address || prev.address,
            city: personalInfo.city || prev.city,
            postalCode: personalInfo.postalCode || prev.postalCode,
            country: personalInfo.country || prev.country,
          }))
        } catch { }
      }

      // Load saved education, employment, and certifications from previous applications
      const savedApplicationData = localStorage.getItem('applicantApplicationData')
      if (savedApplicationData) {
        try {
          const applicationData = JSON.parse(savedApplicationData)
          setForm(prev => ({
            ...prev,
            education: applicationData.education || prev.education,
            employmentHistory: applicationData.employmentHistory || prev.employmentHistory,
            certifications: applicationData.certifications || prev.certifications,
          }))
        } catch { }
      }

      draftLoaded.current = true
    }
  }, [jobId])

  useEffect(() => {
    // Save draft to localStorage (only after draft is loaded)
    // Exclude File objects — they can't be JSON serialized
    if (draftLoaded.current) {
      const draft = {
        ...form,
        cv: null,
        coverLetterFile: null,
        otherDocuments: []
      }
      localStorage.setItem(`jobApplication_${jobId}`, JSON.stringify(draft))
    }
  }, [form, jobId])

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const addEmployment = () => setForm(prev => ({ ...prev, employmentHistory: [...prev.employmentHistory, { ...emptyWork }] }))
  const updateEmployment = (i, field, value) => {
    const e = [...form.employmentHistory]; e[i][field] = value; setForm(prev => ({ ...prev, employmentHistory: e }))
  }
  const removeEmployment = (i) => setForm(prev => ({ ...prev, employmentHistory: prev.employmentHistory.filter((_, j) => j !== i) }))

  const addEducation = () => setForm(prev => ({ ...prev, education: [...prev.education, { ...emptyEdu }] }))
  const updateEducation = (i, field, value) => {
    const e = [...form.education]; e[i][field] = value; setForm(prev => ({ ...prev, education: e }))

    // Auto-fill education level when institution is selected
    if (field === 'institution' && value) {
      const { suggestedLevel } = getInstitutionType(value)
      if (suggestedLevel && !e[i].educationLevel) {
        e[i].educationLevel = suggestedLevel
        setForm(prev => ({ ...prev, education: e }))
      }
    }
  }
  const removeEducation = (i) => setForm(prev => ({ ...prev, education: prev.education.filter((_, j) => j !== i) }))

  const addCert = () => setForm(prev => ({ ...prev, certifications: [...prev.certifications, { ...emptyCert }] }))
  const updateCert = (i, field, value) => {
    const c = [...form.certifications]; c[i][field] = value; setForm(prev => ({ ...prev, certifications: c }))
  }
  const removeCert = (i) => setForm(prev => ({ ...prev, certifications: prev.certifications.filter((_, j) => j !== i) }))

  const addOtherDocument = () => setForm(prev => ({ ...prev, otherDocuments: [...prev.otherDocuments, null] }))
  const updateOtherDocument = (i, file) => {
    const docs = [...form.otherDocuments]; docs[i] = file; setForm(prev => ({ ...prev, otherDocuments: docs }))
  }
  const removeOtherDocument = (i) => setForm(prev => ({ ...prev, otherDocuments: prev.otherDocuments.filter((_, j) => j !== i) }))

  const validateStep = (step) => {
    const newErrors = {}

    switch (step) {
      case 1:
        if (!form.surname.trim()) newErrors.surname = 'Surname is required'
        if (!/^[a-zA-Z\s]{2,}$/.test(form.surname)) newErrors.surname = 'Surname must be letters only, min 2 chars'
        if (!form.firstName.trim()) newErrors.firstName = 'First name is required'
        if (!/^[a-zA-Z\s]{2,}$/.test(form.firstName)) newErrors.firstName = 'First name must be letters only, min 2 chars'
        if (form.otherNames && !/^[a-zA-Z\s]*$/.test(form.otherNames)) newErrors.otherNames = 'Other names must be letters only'
        if (!form.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'
        if (!form.gender) newErrors.gender = 'Gender is required'
        if (!form.maritalStatus) newErrors.maritalStatus = 'Marital status is required'
        if (!form.nationality) newErrors.nationality = 'Nationality is required'
        if (!form.nationalId.trim()) newErrors.nationalId = 'National ID is required'
        if (!form.phone.trim()) newErrors.phone = 'Phone is required'
        if (!/^(\+254|07)\d{8,9}$/.test(form.phone)) newErrors.phone = 'Invalid phone format (use +254XXXXXXXXX or 07XXXXXXXXX)'
        if (!form.email.trim()) newErrors.email = 'Email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
      case 2:
        if (form.education.length === 0) newErrors.education = 'At least one education entry is required'
        form.education.forEach((edu, i) => {
          if (!edu.institution.trim()) newErrors[`education.${i}.institution`] = 'Institution is required'
          if (!edu.program.trim()) newErrors[`education.${i}.program`] = 'Program is required'
          if (!edu.educationLevel) newErrors[`education.${i}.educationLevel`] = 'Education level is required'
          if (!edu.startYear) newErrors[`education.${i}.startYear`] = 'Start year is required'
          if (!/^\d{4}$/.test(edu.startYear)) newErrors[`education.${i}.startYear`] = 'Invalid year format'
          if (!edu.endYear) newErrors[`education.${i}.endYear`] = 'End year is required'
          if (!/^\d{4}$/.test(edu.endYear)) newErrors[`education.${i}.endYear`] = 'Invalid year format'
          if (parseInt(edu.endYear) < parseInt(edu.startYear)) newErrors[`education.${i}.endYear`] = 'End year must be >= start year'
        })
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
      case 3:
        if (form.employmentHistory.length === 0) newErrors.employmentHistory = 'At least one employment entry is required'
        form.employmentHistory.forEach((work, i) => {
          if (!work.employer.trim()) newErrors[`employmentHistory.${i}.employer`] = 'Employer is required'
          if (!work.jobTitle.trim()) newErrors[`employmentHistory.${i}.jobTitle`] = 'Job title is required'
          if (!work.startDate) newErrors[`employmentHistory.${i}.startDate`] = 'Start date is required'
          if (!work.isCurrentJob && !work.endDate) newErrors[`employmentHistory.${i}.endDate`] = 'End date is required'
          if (work.startDate && work.endDate && new Date(work.endDate) < new Date(work.startDate)) {
            newErrors[`employmentHistory.${i}.endDate`] = 'End date must be >= start date'
          }
        })
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
      case 4:
        form.certifications.forEach((cert, i) => {
          if (cert.name && !cert.issuingOrganization) newErrors[`certifications.${i}.issuingOrganization`] = 'Issuing organization is required'
          if (cert.name && !cert.issuingDate) newErrors[`certifications.${i}.issuingDate`] = 'Issuing date is required'
          if (cert.name && !cert.noExpiry && !cert.expiryDate) newErrors[`certifications.${i}.expiryDate`] = 'Expiry date is required'
          if (cert.issuingDate && cert.expiryDate && new Date(cert.expiryDate) < new Date(cert.issuingDate)) {
            newErrors[`certifications.${i}.expiryDate`] = 'Expiry date must be >= issuing date'
          }
        })
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
      case 5:
        if (!form.cv) newErrors.cv = 'CV is required'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
      case 6:
        if (!form.experienceYears) newErrors.experienceYears = 'Experience years is required'
        if (form.experienceYears && (form.experienceYears < 0 || form.experienceYears > 50)) {
          newErrors.experienceYears = 'Experience must be between 0 and 50 years'
        }
        if (!form.availabilityWeeks) newErrors.availabilityWeeks = 'Availability weeks is required'
        if (form.availabilityWeeks && (form.availabilityWeeks < 0 || form.availabilityWeeks > 52)) {
          newErrors.availabilityWeeks = 'Availability must be between 0 and 52 weeks'
        }
        if (!form.rightToWork) newErrors.rightToWork = 'Right to work is required'
        if (!form.salaryExpectation) newErrors.salaryExpectation = 'Salary expectation is required'
        if (form.salaryExpectation && (form.salaryExpectation <= 0 || form.salaryExpectation > 10000000)) {
          newErrors.salaryExpectation = 'Salary must be between 0 and 10,000,000 KES'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
      case 7:
        if (!form.declarationConfirmed) newErrors.declarationConfirmed = 'You must confirm the declaration'
        if (!form.privacyPolicyConfirmed) newErrors.privacyPolicyConfirmed = 'You must acknowledge the privacy policy'
        if (!form.signature.trim()) newErrors.signature = 'Signature is required'
        const fullName = `${form.surname} ${form.firstName} ${form.otherNames}`.trim()
        if (form.signature.trim().toLowerCase() !== fullName.toLowerCase()) {
          newErrors.signature = 'Signature must match your full name'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 7))
    } else {
      toast.error('Please fill in all required fields')
    }
  }

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Only allow submission on step 7
    if (currentStep !== 7) {
      return
    }
    if (!validateStep(7)) {
      toast.error('Please complete all required fields')
      return
    }

    // Confirm submission
    const confirmed = window.confirm('Are you sure you want to submit your application?')
    if (!confirmed) {
      return
    }

    setSubmitting(true)
    try {
      const data = new FormData()

      // Basic info
      data.append('applicantName', `${form.surname} ${form.firstName} ${form.otherNames}`.trim())
      data.append('applicantEmail', form.email)
      data.append('applicantPhone', form.phone)
      data.append('applicationMode', 'structured')

      // Multi-step form data
      data.append('personal_info', JSON.stringify({
        surname: form.surname,
        firstName: form.firstName,
        otherNames: form.otherNames,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        maritalStatus: form.maritalStatus,
        nationality: form.nationality,
        nationalId: form.nationalId,
        phone: form.phone,
        email: form.email,
      }))

      data.append('education', JSON.stringify({
        primaryEducation: [],
        secondaryEducation: [],
        tertiaryEducation: form.education,
        certifications: form.certifications,
      }))

      data.append('employment_history', JSON.stringify(form.employmentHistory))
      data.append('skills', JSON.stringify([]))
      data.append('declaration', JSON.stringify({
        declarationConfirmed: form.declarationConfirmed,
        privacyPolicyConfirmed: form.privacyPolicyConfirmed,
        signature: form.signature,
      }))

      data.append('disclosures', JSON.stringify({
        experienceYears: form.experienceYears,
        availabilityWeeks: form.availabilityWeeks,
        rightToWork: form.rightToWork,
        salaryExpectation: form.salaryExpectation,
      }))

      if (form.cv) data.append('cv', form.cv)
      if (form.coverLetterFile) data.append('coverLetter', form.coverLetterFile)

      await api.post(`/jobs/${jobId}/apply`, data, { headers: { 'Content-Type': 'multipart/form-data' } })

      // Save personal information for future applications
      const personalInfoToSave = {
        surname: form.surname,
        firstName: form.firstName,
        otherNames: form.otherNames,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        maritalStatus: form.maritalStatus,
        nationality: form.nationality,
        nationalId: form.nationalId,
        phone: form.phone,
        email: form.email,
        address: form.address,
        city: form.city,
        postalCode: form.postalCode,
        country: form.country,
      }
      localStorage.setItem('applicantPersonalInfo', JSON.stringify(personalInfoToSave))

      // Save education, employment, and certifications for future applications
      const applicationDataToSave = {
        education: form.education,
        employmentHistory: form.employmentHistory,
        certifications: form.certifications,
      }
      localStorage.setItem('applicantApplicationData', JSON.stringify(applicationDataToSave))

      // Clear draft
      localStorage.removeItem(`jobApplication_${jobId}`)
      setShowSuccess(true)
    } catch (err) {
      console.error('Application error:', err.response?.data)
      toast.error(err.response?.data?.msg || err.response?.data?.error || 'Application failed')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm({
      surname: '', firstName: '', otherNames: '', dateOfBirth: '', gender: '', maritalStatus: '', nationality: '', nationalId: '', phone: '', email: '',
      education: [],
      employmentHistory: [],
      certifications: [],
      cv: null,
      coverLetterFile: null,
      otherDocuments: [],
      experienceYears: '',
      availabilityWeeks: '',
      rightToWork: '',
      salaryExpectation: '',
      declarationConfirmed: false,
      privacyPolicyConfirmed: false,
      signature: '',
    })
    setCurrentStep(1)
    draftLoaded.current = false
  }

  if (loading) return <DashboardLayout><div className="text-center py-8">Loading...</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 max-w-4xl">
        <Card>
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Apply for Position</h1>
            {job && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <h2 className="text-xl font-bold">{job.title}</h2>
                <p className="text-sm text-slate-600">{job.department} · {job.location} · {job.employmentType}</p>
                {job.salaryRange && <p className="text-sm text-slate-500">Salary: {job.salaryRange}</p>}
              </div>
            )}
          </div>

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="relative">
              {/* Background bar */}
              <div className="absolute top-4 left-0 right-0 h-1 bg-slate-200 rounded-full"></div>
              {/* Filled bar */}
              <div className="absolute top-4 left-0 h-1 bg-primary rounded-full transition-all" style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}></div>
              {/* Steps */}
              <div className="relative flex justify-between">
                {STEPS.map((step) => (
                  <div key={step.id} className="flex flex-col items-center" style={{ width: '14.28%' }}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 ${
                      currentStep >= step.id ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {currentStep > step.id ? '✓' : step.id}
                    </div>
                    <div className="text-xs text-center mt-2 text-slate-600 leading-tight">{step.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input label="Surname *" id="surname" name="surname" value={form.surname} onChange={handleChange} required autocomplete="family-name" error={errors.surname} />
                  </div>
                  <div>
                    <Input label="First Name *" id="firstName" name="firstName" value={form.firstName} onChange={handleChange} required autocomplete="given-name" error={errors.firstName} />
                  </div>
                  <Input label="Other Names" id="otherNames" name="otherNames" value={form.otherNames} onChange={handleChange} autocomplete="additional-name" />
                  <DateInput
                    label="Date of Birth"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={(e) => {
                      setForm({...form, dateOfBirth: e.target.value})
                      setErrors(prev => ({ ...prev, dateOfBirth: '' }))
                    }}
                    required
                    error={errors.dateOfBirth}
                    showValidation={true}
                    minAge={18}
                    showCalendar={false}
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Gender</label>
                    <select id="gender" className="form-input w-full" name="gender" value={form.gender} onChange={handleChange}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Marital Status</label>
                    <select id="maritalStatus" className="form-input w-full" name="maritalStatus" value={form.maritalStatus} onChange={handleChange}>
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <Input label="Nationality" id="nationality" name="nationality" value={form.nationality} onChange={handleChange} autocomplete="country-name" />
                  <Input label="National ID Number" id="nationalId" name="nationalId" value={form.nationalId} onChange={handleChange} autocomplete="off" />
                  <Input label="Phone Number *" id="phone" name="phone" value={form.phone} onChange={handleChange} required autocomplete="tel" error={errors.phone} />
                  <Input label="Email Address *" id="email" name="email" type="email" value={form.email} onChange={handleChange} required autocomplete="email" error={errors.email} />
                </div>
              </div>
            )}

            {/* Step 2: Education */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-4">Education</h3>
                <p className="text-sm text-slate-500 mb-4">Add your education history</p>
                
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-slate-500">Education entries</p>
                  <Button type="button" size="sm" onClick={addEducation}>+ Add Education</Button>
                </div>
                {errors.education && <p className="text-red-500 text-sm mb-2">{errors.education}</p>}
                {form.education.map((edu, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-lg mb-3 border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">Institution *</label>
                        <input
                          className={`form-input text-sm ${errors[`education.${i}.institution`] ? 'border-red-500' : ''}`}
                          name={`education_institution_${i}`}
                          placeholder="Institution name"
                          value={edu.institution}
                          onChange={e => updateEducation(i, 'institution', e.target.value)}
                        />
                        {errors[`education.${i}.institution`] && <p className="text-red-500 text-xs mt-1">{errors[`education.${i}.institution`]}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Program *</label>
                        <input
                          className={`form-input text-sm ${errors[`education.${i}.program`] ? 'border-red-500' : ''}`}
                          name={`education_program_${i}`}
                          placeholder="Program of study"
                          value={edu.program}
                          onChange={e => updateEducation(i, 'program', e.target.value)}
                        />
                        {errors[`education.${i}.program`] && <p className="text-red-500 text-xs mt-1">{errors[`education.${i}.program`]}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Education Level *</label>
                        <select
                          className={`form-input text-sm ${errors[`education.${i}.educationLevel`] ? 'border-red-500' : ''}`}
                          name={`education_educationLevel_${i}`}
                          value={edu.educationLevel}
                          onChange={e => updateEducation(i, 'educationLevel', e.target.value)}
                        >
                          <option value="">Select level</option>
                          <option value="Primary">Primary</option>
                          <option value="Secondary">Secondary</option>
                          <option value="Certificate">Certificate</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Bachelor's">Bachelor's</option>
                          <option value="Master's">Master's</option>
                          <option value="PhD">PhD</option>
                        </select>
                        {errors[`education.${i}.educationLevel`] && <p className="text-red-500 text-xs mt-1">{errors[`education.${i}.educationLevel`]}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Start Year *</label>
                        <input
                          className={`form-input text-sm ${errors[`education.${i}.startYear`] ? 'border-red-500' : ''}`}
                          name={`education_startYear_${i}`}
                          type="number"
                          placeholder="YYYY"
                          value={edu.startYear}
                          onChange={e => updateEducation(i, 'startYear', e.target.value)}
                        />
                        {errors[`education.${i}.startYear`] && <p className="text-red-500 text-xs mt-1">{errors[`education.${i}.startYear`]}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">End Year *</label>
                        <input
                          className={`form-input text-sm ${errors[`education.${i}.endYear`] ? 'border-red-500' : ''}`}
                          name={`education_endYear_${i}`}
                          type="number"
                          placeholder="YYYY"
                          value={edu.endYear}
                          onChange={e => updateEducation(i, 'endYear', e.target.value)}
                        />
                        {errors[`education.${i}.endYear`] && <p className="text-red-500 text-xs mt-1">{errors[`education.${i}.endYear`]}</p>}
                      </div>
                    </div>
                    <button type="button" className="text-red-500 text-xs" onClick={() => removeEducation(i)}>Remove</button>
                  </div>
                ))}
                {form.education.length === 0 && <p className="text-sm text-slate-400">No education added. Click the button above to add.</p>}
              </div>
            )}

            {/* Step 3: Employment History */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Employment History</h3>
                <p className="text-sm text-slate-500 mb-4">Add your employment history starting with the most recent</p>
                {errors.employmentHistory && <p className="text-red-500 text-sm mb-2">{errors.employmentHistory}</p>}
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm text-slate-500">Employment entries</p>
                  <Button type="button" size="sm" onClick={addEmployment}>+ Add Employment</Button>
                </div>
                {form.employmentHistory.map((work, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-lg mb-3 border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">Employer *</label>
                        <input
                          className={`form-input text-sm ${errors[`employmentHistory.${i}.employer`] ? 'border-red-500' : ''}`}
                          name={`employment_employer_${i}`}
                          placeholder="Company/Organization name"
                          value={work.employer}
                          onChange={e => updateEmployment(i, 'employer', e.target.value)}
                        />
                        {errors[`employmentHistory.${i}.employer`] && <p className="text-red-500 text-xs mt-1">{errors[`employmentHistory.${i}.employer`]}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Job Title *</label>
                        <input
                          className={`form-input text-sm ${errors[`employmentHistory.${i}.jobTitle`] ? 'border-red-500' : ''}`}
                          name={`employment_jobTitle_${i}`}
                          placeholder="Position/Role"
                          value={work.jobTitle}
                          onChange={e => updateEmployment(i, 'jobTitle', e.target.value)}
                        />
                        {errors[`employmentHistory.${i}.jobTitle`] && <p className="text-red-500 text-xs mt-1">{errors[`employmentHistory.${i}.jobTitle`]}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name={`employment_isCurrentJob_${i}`}
                          checked={work.isCurrentJob}
                          onChange={e => updateEmployment(i, 'isCurrentJob', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <label className="text-sm">Is this your current job?</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Start Date *</label>
                        <input
                          className={`form-input text-sm ${errors[`employmentHistory.${i}.startDate`] ? 'border-red-500' : ''}`}
                          name={`employment_startDate_${i}`}
                          type="date"
                          value={work.startDate}
                          onChange={e => updateEmployment(i, 'startDate', e.target.value)}
                        />
                        {errors[`employmentHistory.${i}.startDate`] && <p className="text-red-500 text-xs mt-1">{errors[`employmentHistory.${i}.startDate`]}</p>}
                      </div>
                      {!work.isCurrentJob && (
                        <div>
                          <label className="block text-sm font-medium mb-1">End Date *</label>
                          <input
                            className={`form-input text-sm ${errors[`employmentHistory.${i}.endDate`] ? 'border-red-500' : ''}`}
                            name={`employment_endDate_${i}`}
                            type="date"
                            value={work.endDate}
                            onChange={e => updateEmployment(i, 'endDate', e.target.value)}
                          />
                          {errors[`employmentHistory.${i}.endDate`] && <p className="text-red-500 text-xs mt-1">{errors[`employmentHistory.${i}.endDate`]}</p>}
                        </div>
                      )}
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium mb-1">Achievements</label>
                      <textarea
                        className="form-input text-sm"
                        name={`employment_achievements_${i}`}
                        placeholder="Key achievements and responsibilities"
                        value={work.achievements}
                        onChange={e => updateEmployment(i, 'achievements', e.target.value)}
                        rows={2}
                        maxLength={500}
                      />
                    </div>
                    <button type="button" className="text-red-500 text-xs" onClick={() => removeEmployment(i)}>Remove</button>
                  </div>
                ))}
                {form.employmentHistory.length === 0 && <p className="text-sm text-slate-400">No employment history added. Click the button above to add.</p>}
              </div>
            )}

            {/* Step 4: Certifications & Licenses */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Certifications & Licenses</h3>
                <p className="text-sm text-slate-500 mb-4">Add your professional certifications (optional)</p>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm text-slate-500">Certification entries</p>
                  <Button type="button" size="sm" onClick={addCert}>+ Add Certification</Button>
                </div>
                {form.certifications.map((cert, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-lg mb-3 border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">Certification Name</label>
                        <input
                          className={`form-input text-sm ${errors[`certifications.${i}.issuingOrganization`] && cert.name ? 'border-red-500' : ''}`}
                          name={`cert_name_${i}`}
                          placeholder="Certificate name"
                          value={cert.name}
                          onChange={e => updateCert(i, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Issuing Organization {cert.name ? '*' : ''}</label>
                        <input
                          className={`form-input text-sm ${errors[`certifications.${i}.issuingOrganization`] ? 'border-red-500' : ''}`}
                          name={`cert_issuingOrganization_${i}`}
                          placeholder="Issuing organization"
                          value={cert.issuingOrganization}
                          onChange={e => updateCert(i, 'issuingOrganization', e.target.value)}
                        />
                        {errors[`certifications.${i}.issuingOrganization`] && <p className="text-red-500 text-xs mt-1">{errors[`certifications.${i}.issuingOrganization`]}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Certificate Number</label>
                        <input
                          className="form-input text-sm"
                          name={`cert_certificateNumber_${i}`}
                          placeholder="Certificate number"
                          value={cert.certificateNumber}
                          onChange={e => updateCert(i, 'certificateNumber', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Issuing Date {cert.name ? '*' : ''}</label>
                        <input
                          className={`form-input text-sm ${errors[`certifications.${i}.issuingDate`] ? 'border-red-500' : ''}`}
                          name={`cert_issuingDate_${i}`}
                          type="date"
                          value={cert.issuingDate}
                          onChange={e => updateCert(i, 'issuingDate', e.target.value)}
                        />
                        {errors[`certifications.${i}.issuingDate`] && <p className="text-red-500 text-xs mt-1">{errors[`certifications.${i}.issuingDate`]}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Expiration Date {cert.name && !cert.noExpiry ? '*' : ''}</label>
                        <input
                          className={`form-input text-sm ${errors[`certifications.${i}.expiryDate`] ? 'border-red-500' : ''} ${cert.noExpiry ? 'opacity-50' : ''}`}
                          name={`cert_expiryDate_${i}`}
                          type="date"
                          value={cert.expiryDate}
                          onChange={e => updateCert(i, 'expiryDate', e.target.value)}
                          disabled={cert.noExpiry}
                        />
                        {errors[`certifications.${i}.expiryDate`] && <p className="text-red-500 text-xs mt-1">{errors[`certifications.${i}.expiryDate`]}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name={`cert_noExpiry_${i}`}
                          checked={cert.noExpiry}
                          onChange={e => updateCert(i, 'noExpiry', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <label className="text-sm">No expiry date?</label>
                      </div>
                    </div>
                    <button type="button" className="text-red-500 text-xs" onClick={() => removeCert(i)}>Remove</button>
                  </div>
                ))}
                {form.certifications.length === 0 && <p className="text-sm text-slate-400">No certifications added. Click the button above to add.</p>}
              </div>
            )}

            {/* Step 5: Attachments */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Attachments</h3>
                <p className="text-sm text-slate-500 mb-4">Upload your CV, cover letter, and other supporting documents</p>
                {errors.cv && <p className="text-red-500 text-sm mb-2">{errors.cv}</p>}
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <label className="block text-sm font-medium mb-2">CV * (PDF, DOC, DOCX - Max 5MB)</label>
                  <input
                    type="file"
                    name="cv"
                    accept=".pdf,.doc,.docx"
                    onChange={handleChange}
                    className={`form-input text-sm ${errors.cv ? 'border-red-500' : ''}`}
                  />
                  {form.cv && <p className="text-sm text-green-600 mt-1">Selected: {form.cv.name}</p>}
                </div>
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <label className="block text-sm font-medium mb-2">Cover Letter (PDF, DOC, DOCX - Max 2MB)</label>
                  <input
                    type="file"
                    name="coverLetterFile"
                    accept=".pdf,.doc,.docx"
                    onChange={handleChange}
                    className="form-input text-sm"
                  />
                  {form.coverLetterFile && <p className="text-sm text-green-600 mt-1">Selected: {form.coverLetterFile.name}</p>}
                </div>
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Other Supporting Documents (Max 10MB each, max 5 files)</label>
                    <Button type="button" size="sm" onClick={addOtherDocument}>+ Add Document</Button>
                  </div>
                  {form.otherDocuments.map((doc, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        type="file"
                        name={`otherDocument_${i}`}
                        accept=".pdf,.doc,.docx"
                        onChange={e => updateOtherDocument(i, e.target.files[0])}
                        className="form-input text-sm flex-1"
                      />
                      <button type="button" className="text-red-500 text-xs" onClick={() => removeOtherDocument(i)}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Disclosures */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Disclosures</h3>
                <p className="text-sm text-slate-500 mb-4">Please provide the following information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Experience Years *</label>
                    <input
                      type="number"
                      name="experienceYears"
                      value={form.experienceYears}
                      onChange={handleChange}
                      min="0"
                      max="50"
                      className={`form-input ${errors.experienceYears ? 'border-red-500' : ''}`}
                    />
                    {errors.experienceYears && <p className="text-red-500 text-xs mt-1">{errors.experienceYears}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Availability (weeks) *</label>
                    <input
                      type="number"
                      name="availabilityWeeks"
                      value={form.availabilityWeeks}
                      onChange={handleChange}
                      min="0"
                      max="52"
                      className={`form-input ${errors.availabilityWeeks ? 'border-red-500' : ''}`}
                    />
                    {errors.availabilityWeeks && <p className="text-red-500 text-xs mt-1">{errors.availabilityWeeks}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Right to Work in Kenya? *</label>
                    <select
                      name="rightToWork"
                      value={form.rightToWork}
                      onChange={handleChange}
                      className={`form-input ${errors.rightToWork ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    {errors.rightToWork && <p className="text-red-500 text-xs mt-1">{errors.rightToWork}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Monthly Salary Expectation (KES) *</label>
                    <input
                      type="number"
                      name="salaryExpectation"
                      value={form.salaryExpectation}
                      onChange={handleChange}
                      min="0"
                      max="10000000"
                      className={`form-input ${errors.salaryExpectation ? 'border-red-500' : ''}`}
                    />
                    {errors.salaryExpectation && <p className="text-red-500 text-xs mt-1">{errors.salaryExpectation}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Declaration */}
            {currentStep === 7 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Declaration</h3>
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-slate-600 mb-4">
                    For more information on how we handle your personal data during the recruitment process, including how you can later withdraw your consent to our processing this data, please refer to our <a href="#" className="text-[#CB7246] hover:underline">candidate privacy policy</a>.
                  </p>
                  <h4 className="font-medium mb-2">Your Declaration</h4>
                  <p className="text-sm text-slate-600 mb-4">
                    I declare that the information provided herein as part of my job submission is true to the best of my knowledge and belief.
                  </p>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        name="declarationConfirmed"
                        checked={form.declarationConfirmed}
                        onChange={handleChange}
                        className={`w-4 h-4 ${errors.declarationConfirmed ? 'border-red-500' : ''}`}
                      />
                      <label className="text-sm">I confirm the above declaration *</label>
                    </div>
                    {errors.declarationConfirmed && <p className="text-red-500 text-xs">{errors.declarationConfirmed}</p>}
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        name="privacyPolicyConfirmed"
                        checked={form.privacyPolicyConfirmed}
                        onChange={handleChange}
                        className={`w-4 h-4 ${errors.privacyPolicyConfirmed ? 'border-red-500' : ''}`}
                      />
                      <label className="text-sm">I acknowledge the privacy policy *</label>
                    </div>
                    {errors.privacyPolicyConfirmed && <p className="text-red-500 text-xs">{errors.privacyPolicyConfirmed}</p>}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Confirm by entering your full name *</label>
                    <input
                      type="text"
                      name="signature"
                      value={form.signature}
                      onChange={handleChange}
                      placeholder={`${form.surname} ${form.firstName} ${form.otherNames}`.trim()}
                      className={`form-input ${errors.signature ? 'border-red-500' : ''}`}
                    />
                    {errors.signature && <p className="text-red-500 text-xs">{errors.signature}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-4 border-t">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>Back</Button>
              {currentStep < 7 ? (
                <Button type="button" variant="primary" onClick={nextStep}>Next</Button>
              ) : (
                <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Application'}</Button>
              )}
            </div>
          </form>

          <Modal isOpen={showSuccess} onClose={() => { setShowSuccess(false); resetForm(); navigate('/jobs') }} title="Application Submitted">
            <div className="p-4 text-center">
              <p className="mb-4">Thank you for your application! We will review your submission and contact you if shortlisted.</p>
              <Button variant="primary" onClick={() => { setShowSuccess(false); resetForm(); navigate('/jobs') }}>Okay</Button>
            </div>
          </Modal>

        </Card>
      </div>
    </DashboardLayout>
  )
}
