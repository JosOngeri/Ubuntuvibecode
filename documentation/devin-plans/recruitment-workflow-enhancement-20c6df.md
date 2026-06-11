# Recruitment Workflow Enhancement Plan

This plan enhances the recruitment workflow to properly store 7-step application data, implement parameter-based applicant filtering, create an offer acceptance/negotiation workflow, and streamline onboarding with auto-population and asset/supervisor assignment.

## 1. Fix 7-Step Application Data Storage

### Backend Changes
**File: `backend/controllers/job.controller.js` - `applyToJob` function**
- Update to accept and store the 7-step structured data fields from the frontend:
  - `personal_info` (firstName, lastName, dateOfBirth, gender, maritalStatus, nationality, nationalId, phone, email)
  - `address_info` (residentialAddress, postalAddress, emergencyContact)
  - `position_details` (position, department, expectedSalary, dateAvailable, employmentType, willingToRelocate, willingToTravel)
  - `education` (primary, secondary, furtherEducation, certifications)
  - `employment_history` (array of work experience)
  - `references` (array of references)
  - `skills` (languages, computerSkills, otherSkills)
  - `declaration` (coverLetter, declarationConfirmed, backgroundCheckConsent, signature)
- Add validation:
  - Date of birth must be at least 18 years ago
  - Cannot apply for job before current date
  - Cannot apply after application closing date
  - Required fields validation
  - Email format validation
- Update the INSERT query to include these columns

**File: `backend/models/JobApplication.model.js`**
- Ensure all 7-step columns are properly added via `ensureColumns()`
- Add missing columns if any: `skills`, `declaration`

### Frontend Changes
**File: `frontend/src/pages/recruitment/MultiStepJobApplicationForm.jsx`**
- Verify the data is being sent correctly in the `handleSubmit` function
- Ensure all 7-step data is properly formatted before sending to backend

## 2. Add Job Post Count Input

### Frontend Changes
**File: `frontend/src/pages/recruitment/JobPostingManagement.jsx` or job creation form**
- Add input field for "Number of Positions" with default value of 1
- Add up/down arrow controls to increment/decrement the number
- Store the number of positions in the job record

### Backend Changes
**File: `backend/models/Job.model.js`**
- Add column `numberOfPositions` with default value of 1
- Update job creation to accept and store number of positions

## 3. Add Offer Token Validation

### Backend Changes
**File: `backend/controllers/job.controller.js` - Update `acceptOffer` and `negotiateSalary`**
- Require applicant to input a one-time token (e.g., last 4 digits of phone or national ID)
- Validate the token matches applicant data before allowing offer response
- Return error if token validation fails

### Frontend Changes
**File: `frontend/src/pages/recruitment/OfferResponse.jsx`**
- Add input field for one-time token validation
- Show instructions to applicant (e.g., "Enter last 4 digits of your phone number")
- Validate token before submitting offer response
- Show error message if token is invalid

## 4. Implement Parameter-Based Applicant Filtering

### Backend Changes
**File: `backend/controllers/job.controller.js` - New endpoint**
- Create `filterApplicants` endpoint that accepts filtering parameters
- Accept an array of filter criteria with field name, operator, and value
- Query the job_applications table filtering on the 7-step structured data columns
- Return filtered and ranked applicants

### Frontend Changes
**File: `frontend/src/pages/recruitment/ApplicantReviewDashboard.jsx`**
- Add a filter configuration section with checkboxes for each 7-step data field:
  - Personal Info: gender, nationality, age range
  - Address: location/city
  - Position Details: willingToRelocate, willingToTravel, expectedSalary range, dateAvailable
  - Education: qualification level (Certificate, Diploma, Bachelor's, Master's, PhD)
  - Employment History: years of experience range
  - Skills: specific skills/languages
  - Certifications: has certifications
- Add "Apply Filters" button to filter the applicant list
- Display filtered results sorted by relevance/match score

## 3. Interview and Shortlist Workflow

### Backend Changes
**File: `backend/controllers/job.controller.js` - New endpoints**
- `shortlistApplication(applicationId)`: 
  - Update application status to "shortlisted"
  - Create interview step for the application
  - Initialize scorecard based on job qualifications
- `updateInterviewScore(applicationId, score, notes)`: 
  - Update interview score (percentage)
  - Store interview notes
- `sendOffer(applicationId, offerAmount)`: 
  - Update application status to "offer_sent"
  - Store offered salary
  - Generate offer token
  - Send email to applicant with offer details

### Database Changes
**File: `backend/models/JobApplication.model.js`**
- Add columns: `interview_score`, `interview_notes`, `interview_date`, `offered_salary`, `interview_status`

### Frontend Changes
**File: `frontend/src/pages/recruitment/ApplicantReviewDashboard.jsx`**
- Add "Shortlist" button in actions column
- When clicked, call `shortlistApplication` API
- Add interview score input for shortlisted applicants
- Add "Send Offer" button that prompts for salary amount
- Display milestone tracker showing application progress (Applied → Shortlisted → Interviewed → Offer Sent → Accepted/Hired)

## 4. Create Offer Acceptance/Negotiation Workflow

### Backend Changes
**File: `backend/controllers/job.controller.js` - New endpoints**
- `sendOfferEmail(applicationId)`: 
  - Update application status to "offer_sent"
  - Generate a unique offer token
  - Send email to applicant with link to offer acceptance page
- `getOfferDetails(token)`: 
  - Validate token and return offer details (position, salary, etc.)
- `acceptOffer(token)`: 
  - Update application status to "offer_accepted"
- `negotiateSalary(token, counterOffer)`: 
  - Update application status to "offer_negotiated"
  - Store counter-offer amount
  - Notify admin/manager of counter-offer
- `updateOfferSalary(applicationId, newSalary)`: 
  - Admin updates salary and re-sends offer

### Database Changes
**File: `backend/models/JobApplication.model.js`**
- Add columns: `offer_token`, `offer_sent_at`, `offer_status`, `counter_offer_salary`, `final_salary`

### Frontend Changes
**File: `frontend/src/pages/recruitment/ApplicantReviewDashboard.jsx`**
- Add "Send Offer" button in the actions column
- When clicked, call `sendOfferEmail` API

**New File: `frontend/src/pages/recruitment/OfferResponse.jsx`**
- Public page accessible via offer token
- Display job details, offered salary
- Two buttons: "Accept Offer" and "Negotiate Salary"
- If "Negotiate Salary" clicked, show input field for counter-offer amount
- Submit handler calls appropriate API endpoint

## 4. Enhance Onboarding with Auto-Population

### Backend Changes
**File: `backend/controllers/onboarding.controller.js` - Update `initiate` function**
- Accept `applicationId` parameter
- Fetch application data using `JobApplication.findById(applicationId)`
- Auto-populate onboarding record with application data:
  - Personal info (firstName, lastName, dateOfBirth, etc.)
  - Address info
  - Education history
  - Employment history
  - Skills
- Keep the existing supervisor and asset assignment logic

**File: `backend/controllers/onboarding.controller.js` - Update `assignAsset` function**
- Add support for text-based asset description (not just assetId)
- Allow manager to manually enter asset details like "Uniform Size M" or "Laptop Dell XPS"

### Frontend Changes
**File: `frontend/src/pages/admin/Onboarding.jsx` (or create new onboarding page)**
- Add "Start Onboarding" button that accepts an application ID
- When clicked, show modal/form with:
  - Auto-populated fields from application data (read-only)
  - Supervisor selection dropdown (blank field to be filled by manager)
  - Asset assignment section:
    - List of assets to select from (uniform, tools of work)
    - Text input for asset details (e.g., "Uniform Size M", "Safety Boots Size 42")
- Submit handler calls onboarding initiate endpoint

## 5. Create User Account and Send Credentials

### Backend Changes
**File: `backend/controllers/onboarding.controller.js` - Update `completeStep` function**
- When the "confirmation" step is completed:
  - Generate username: `firstname.lastname` (lowercase)
  - Generate random temporary password
  - Hash the password using bcrypt
  - Create user account with role "employee"
  - Link user to employee record
  - Set `mustChangePassword = true`
  - Send email to employee with username and link to set password

**File: `backend/controllers/auth.controller.js`**
- Already has password reset functionality - no changes needed

### Frontend Changes
**File: `frontend/src/pages/recruitment/OfferResponse.jsx`**
- After offer acceptance, the user account will be created during onboarding confirmation
- No frontend changes needed for this step

**File: `frontend/src/pages/auth/ResetPassword.jsx`**
- Already exists - ensure it works for new employees setting their initial password

## 6. Extend Job Application Date

### Backend Changes
**File: `backend/controllers/job.controller.js` - New endpoint**
- `extendApplicationDeadline(jobId, newDeadline)`: 
  - Update job's applicationClosingDate to new date
  - Validate that new date is in the future
  - Return updated job details

### Frontend Changes
**File: `frontend/src/pages/recruitment/JobDetail.jsx` or `JobPostingManagement.jsx`**
- Add "Extend Deadline" button in job details
- When clicked, show date picker modal
- Submit handler calls `extendApplicationDeadline` API
- Display new closing date after update

## 7. Horizontal Scroll View for Applicants

### Frontend Changes
**File: `frontend/src/pages/recruitment/ApplicantReviewDashboard.jsx`**
- Add a toggle or separate view for "Detailed Grid View" with horizontal scrolling
- Display all 7-step application data columns in a horizontal scrollable table:
  - Personal Info columns (firstName, lastName, dateOfBirth, gender, nationality, phone, email)
  - Address columns (city, postalCode)
  - Position columns (expectedSalary, dateAvailable, willingToRelocate, willingToTravel)
  - Education columns (qualification levels, certifications)
  - Employment columns (years of experience)
  - Skills columns (languages, computerSkills)
  - Status column with quick actions (Accept, Reject, Shortlist)
- Enable inline filtering and sorting on all columns
- Add bulk actions (Reject Selected, Shortlist Selected)

## 8. Supervisor Role Selection

### Backend Changes
**File: `backend/controllers/onboarding.controller.js` - Update `initiate` function**
- Fetch users with roles: 'manager', 'admin', 'supervisor'
- Return list of eligible supervisors

### Frontend Changes
**File: `frontend/src/pages/admin/Onboarding.jsx`**
- Update supervisor selection dropdown to include:
  - Manager role users
  - Admin role users
  - Supervisor role users
- Display supervisor name and role in dropdown
- Filter dropdown by role if needed

## 9. Admin Password Reset for Employees

### Backend Changes
**File: `backend/controllers/user.controller.js` - New function**
- `sendPasswordReset(userId)`: 
  - Find user by ID
  - Generate reset token (reuse existing logic from auth.controller.js)
  - Send email to user with reset link

### Frontend Changes
**File: `frontend/src/pages/admin/Users.jsx`**
- Add "Reset Password" button in the actions column
- When clicked, call `sendPasswordReset` API
- Show toast message confirming reset email sent

## Implementation Order

1. Fix 7-step application data storage (backend validation and column mapping)
2. Test 7-step data submission and storage
3. Implement interview and shortlist workflow with scorecard
4. Implement parameter-based applicant filtering
5. Create horizontal scroll view for applicants with all data visible and milestone tracker
6. Add job application deadline extension feature
7. Create offer acceptance/negotiation workflow
8. Enhance onboarding with auto-population and supervisor role selection
9. Implement user account creation on onboarding confirmation
10. Add admin password reset functionality
