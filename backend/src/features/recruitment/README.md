# Recruitment Feature

## Overview
The Recruitment feature manages job postings and job applications throughout the hiring process. It provides a complete workflow from job creation to candidate hiring.

## Architecture

### Backend Structure
```
src/features/recruitment/
├── controllers/
│   ├── job.controller.js       # HTTP request handlers for jobs
│   └── application.controller.js # HTTP request handlers for applications
├── services/
│   ├── job.service.js          # Business logic for jobs
│   └── application.service.js  # Business logic for applications
├── repositories/
│   ├── job.repository.js       # Data access for jobs
│   └── application.repository.js # Data access for applications
└── validators/
    └── (validation schemas)
```

### Frontend Structure
```
src/features/recruitment/
├── pages/                      # UI components
├── services/
│   ├── jobApi.js              # API client for jobs
│   └── applicationApi.js      # API client for applications
├── hooks/
│   ├── useJobs.js             # React hook for job state
│   └── useApplications.js     # React hook for application state
└── components/                # Reusable UI components
```

## Key Workflows

### Job Posting Workflow
1. **Create Job**: `POST /api/jobs` - Create a new job posting
2. **Publish Job**: `POST /api/jobs/:id/publish` - Make job visible to applicants
3. **Close Job**: `POST /api/jobs/:id/close` - Stop accepting applications
4. **Update Job**: `PUT /api/jobs/:id` - Modify job details
5. **Delete Job**: `DELETE /api/jobs/:id` - Remove job posting

### Application Workflow
1. **Submit Application**: `POST /api/applications` - Candidate applies for job
2. **Shortlist**: `POST /api/applications/:id/shortlist` - Mark for review
3. **Schedule Interview**: `POST /api/applications/:id/interview` - Set up interview
4. **Send Offer**: `POST /api/applications/:id/offer` - Send job offer
5. **Respond to Offer**: `POST /api/applications/offer-response` - Candidate accepts/rejects
6. **Hire/Reject**: Update status to 'hired' or 'rejected'

## Database Tables

### jobs
- `id` (PK)
- `title`, `description`, `department`, `location`
- `employment_type`, `status` (open/closed)
- `salary_range`, `salary_min`, `salary_max`
- `application_deadline`, `posted_by`
- `qualifications`, `evaluation_params` (JSONB)
- `advertisement_data` (JSONB)

### job_applications
- `id` (PK)
- `job_id` (FK → jobs.id)
- `employee_id` (FK → employees.id)
- `applicant_name`, `applicant_email`, `applicant_phone`
- `status` (pending/shortlisted/interview_scheduled/hired/rejected)
- `interview_score`, `interview_notes`, `interview_date`
- `offer_token`, `offer_status`, `offered_salary`
- `education_history`, `employment_history` (JSONB)

## API Endpoints

### Jobs
- `GET /api/jobs` - List all jobs (filter by open status)
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/jobs/:id/publish` - Publish job
- `POST /api/jobs/:id/close` - Close job

### Applications
- `GET /api/applications` - List all applications
- `GET /api/applications/:id` - Get application details
- `GET /api/applications/job/:jobId` - Get applications for a job
- `GET /api/applications/user/:userId` - Get applications for a user
- `GET /api/applications/shortlisted` - Get shortlisted applications
- `POST /api/applications` - Submit application
- `PUT /api/applications/:id/status` - Update status
- `POST /api/applications/:id/shortlist` - Shortlist application
- `POST /api/applications/:id/interview` - Schedule interview
- `POST /api/applications/:id/offer` - Send offer
- `POST /api/applications/offer-response` - Respond to offer
- `POST /api/applications/:id/reject` - Reject application
- `DELETE /api/applications/:id` - Delete application

## Frontend Hooks

### useJobs
```javascript
const { jobs, loading, error, createJob, updateJob, deleteJob, publishJob, closeJob } = useJobs(filters);
```

### useApplications
```javascript
const { 
  applications, 
  loading, 
  error, 
  createApplication, 
  updateStatus, 
  shortlistApplication,
  scheduleInterview,
  sendOffer,
  respondToOffer,
  rejectApplication,
  deleteApplication 
} = useApplications();
```

## Business Rules

1. **Job Deadline Validation**: Application deadline cannot be in the past
2. **Job Status**: Only 'open' jobs accept applications
3. **Offer Expiry**: Offer tokens expire after 72 hours
4. **Status Transitions**: Applications follow defined status flow
5. **Email Notifications**: Automatic emails for interviews and offers

## Testing

### Unit Tests
- Test service layer business logic
- Test repository data access
- Test validation rules

### Integration Tests
- Test API endpoints with test database
- Test complete workflows
- Test error handling

## Dependencies

### Backend
- `Job.model.js` - Job data model
- `JobApplication.model.js` - Application data model
- `Employee.model.js` - Employee data model
- `utils/email.js` - Email sending utility
- `utils/logger.js` - Logging utility

### Frontend
- `services/api.js` - Shared API client
- `contexts/AuthContext` - User authentication
- `contexts/SettingsContext` - Application settings

## Notes for Junior Developers

- **Never modify models directly** - Use repositories for data access
- **Business logic goes in services** - Controllers only handle HTTP
- **Use standardized response utility** - `src/shared/utils/response.js`
- **Validate at API boundary** - Use validators before processing
- **Log important actions** - Use logger for debugging
- **Handle errors gracefully** - Return proper error responses
