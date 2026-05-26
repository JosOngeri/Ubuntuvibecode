# Ubuntu HRMS Deployment Guide

## Overview
This guide explains how to deploy the Ubuntu HRMS application with backend on Render and frontend on Vercel.

## Architecture
```
Frontend (Vercel) → Backend API (Render) → PostgreSQL (Render)
```

- **Frontend**: React/Vite app deployed to Vercel
- **Backend**: Node.js/Express deployed to Render
- **Database**: PostgreSQL deployed to Render (existing Ubuntu_hrms_db)

## Repository
- GitHub Repository: https://github.com/JosOngeri/Ubuntu.git
- Backend Directory: `backend/`
- Frontend Directory: `frontend/`

## Phase 1: Backend Deployment to Render

### Step 1: Update Render Web Service

1. Log in to Render dashboard at https://render.com
2. Navigate to existing web service (ubuntu-hrms-backend)
3. Update repository connection:
   - Disconnect from old repo (if connected to Ubuntu-hrms.git)
   - Connect to current repo: https://github.com/JosOngeri/Ubuntu.git
   - Set root directory to `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`

### Step 2: Configure Render Environment Variables

In Render dashboard for the web service, set these environment variables:

**Required:**
- `NODE_ENV`: `production`
- `PORT`: `5000`
- `DATABASE_URL`: (use existing - points to Ubuntu_hrms_db)
- `POSTGRES_URL`: (use existing - points to Ubuntu_hrms_db)
- `JWT_SECRET`: (use existing or generate new)
- `FRONTEND_ORIGIN`: `https://ubuntu-hrms.vercel.app`
- `FRONTEND_URL`: `https://ubuntu-hrms.vercel.app`

**Database Settings:**
- `PGSSLMODE`: `require`
- `PGPOOL_MAX`: `10`

**Email Configuration (if using email features):**
- `SMTP_HOST`: `smtp.gmail.com`
- `SMTP_PORT`: `587`
- `SMTP_USER`: your email
- `SMTP_PASS`: your app password
- `SMTP_FROM_EMAIL`: your email

**SMS Configuration (if using SMS features):**
- `BLESSED_TEXT_API_KEY`: your API key
- `BLESSED_TEXT_SENDER_ID`: your sender ID

### Step 3: Deploy Backend

1. Commit and push changes to GitHub main branch
2. Render will auto-deploy from the main branch
3. Monitor deployment logs in Render dashboard
4. Verify backend is accessible at `https://ubuntu-hrms-backend.onrender.com`
5. Test health check: `https://ubuntu-hrms-backend.onrender.com/api/health`

## Phase 2: Frontend Deployment to Vercel

### Step 1: Create Vercel Project

1. Log in to Vercel dashboard at https://vercel.com
2. Click "Add New Project"
3. Import repository: https://github.com/JosOngeri/Ubuntu.git
4. Configure project settings:
   - Root Directory: `frontend`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click "Deploy"

### Step 2: Configure Vercel Environment Variable

In Vercel project settings:
1. Go to Settings → Environment Variables
2. Add variable:
   - Name: `VITE_API_URL`
   - Value: `https://ubuntu-hrms-backend.onrender.com/api`
   - Environments: Production, Preview, Development
3. Save and redeploy if needed

### Step 3: Deploy Frontend

1. Commit and push changes to GitHub main branch
2. Vercel will auto-deploy from the main branch
3. Monitor deployment logs in Vercel dashboard
4. Verify frontend is accessible at `https://ubuntu-hrms.vercel.app`

## Local Development Workflow

### Backend Local Development

Keep `backend/.env` with localhost settings:
```env
PORT=5000
DATABASE_URL=postgresql://user:pass@host/ubuntu_hrms_db
POSTGRES_URL=postgresql://user:pass@host/ubuntu_hrms_db
JWT_SECRET=your-jwt-secret
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
PGSSLMODE=require
PGPOOL_MAX=10
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
BLESSED_TEXT_API_KEY=your-api-key
BLESSED_TEXT_SENDER_ID=your-sender-id
```

Start backend:
```bash
cd backend
npm install
npm start
```

### Frontend Local Development

Keep `frontend/.env.example` with localhost settings:
```env
VITE_API_URL=http://localhost:5000
```

Start frontend:
```bash
cd frontend
npm install
npm run dev
```

### Manual Production Deployment

When deploying to production:
1. Backend: Update Render environment variables in dashboard (no code changes needed)
2. Frontend: Update `frontend/.env.production` with production backend URL
3. Commit and push changes
4. Wait for auto-deployment
5. After deployment, no need to change back (production uses .env.production, local uses .env)

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode (development/production) | Yes |
| `PORT` | Server port | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `POSTGRES_URL` | PostgreSQL connection string (alternative) | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `FRONTEND_ORIGIN` | Frontend URL for CORS | Yes |
| `FRONTEND_URL` | Frontend URL | Yes |
| `PGSSLMODE` | PostgreSQL SSL mode | Yes |
| `PGPOOL_MAX` | PostgreSQL pool max connections | Yes |
| `SMTP_HOST` | SMTP server host | Optional |
| `SMTP_PORT` | SMTP server port | Optional |
| `SMTP_USER` | SMTP username | Optional |
| `SMTP_PASS` | SMTP password | Optional |
| `SMTP_FROM_EMAIL` | From email address | Optional |
| `BLESSED_TEXT_API_KEY` | SMS API key | Optional |
| `BLESSED_TEXT_SENDER_ID` | SMS sender ID | Optional |

### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |

## Testing and Verification

### Backend Testing Checklist
- [ ] Backend health check responds: `https://ubuntu-hrms-backend.onrender.com/api/health`
- [ ] Database connection works (using existing Ubuntu_hrms_db)
- [ ] Authentication endpoints work
- [ ] CORS allows Vercel frontend
- [ ] Email sending works (if configured)
- [ ] SMS sending works (if configured)

### Frontend Testing Checklist
- [ ] Frontend loads successfully at `https://ubuntu-hrms.vercel.app`
- [ ] Can connect to backend API
- [ ] Login/Register works
- [ ] All pages load correctly
- [ ] File uploads work
- [ ] PDF generation works

### Integration Testing Checklist
- [ ] User can register from frontend
- [ ] User can login from frontend
- [ ] Data persists in Ubuntu_hrms_db
- [ ] All CRUD operations work

## Troubleshooting

### CORS Issues
**Problem**: Frontend cannot connect to backend due to CORS errors

**Solution**:
- Ensure `FRONTEND_ORIGIN` in Render environment variables matches your Vercel domain
- Check backend `app.js` CORS configuration includes production URL
- Verify backend is running and accessible

### Database Connection Issues
**Problem**: Backend cannot connect to PostgreSQL

**Solution**:
- Verify `DATABASE_URL` and `POSTGRES_URL` are correct in Render
- Check `PGSSLMODE` is set to `require`
- Ensure PostgreSQL database is running on Render
- Check Render database logs

### File Upload Issues
**Problem**: File uploads fail in production

**Solution**:
- Ensure uploads directory exists in backend
- Consider using cloud storage (AWS S3, Cloudinary) for production
- Check file size limits in Render

### Build Failures
**Problem**: Deployment fails during build

**Solution**:
- Check build logs in Render/Vercel dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility
- Check for missing environment variables

### Environment Variables Not Loading
**Problem**: Application doesn't use production environment variables

**Solution**:
- Verify variable names match exactly (case-sensitive)
- Check variables are set in correct environment (Production)
- Redeploy after adding environment variables
- Ensure dotenv is configured correctly in backend

## URLs

- **Frontend**: https://ubuntu-hrms.vercel.app
- **Backend**: https://ubuntu-hrms-backend.onrender.com
- **Backend Health**: https://ubuntu-hrms-backend.onrender.com/api/health
- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard

## Rollback Procedure

### Backend Rollback
1. Go to Render dashboard
2. Navigate to web service
3. Click on "Deployments" tab
4. Find previous successful deployment
5. Click "Rollback" to revert

### Frontend Rollback
1. Go to Vercel dashboard
2. Navigate to project
3. Click on "Deployments" tab
4. Find previous successful deployment
5. Click "..." menu and select "Redeploy"

## Additional Resources

- Render Documentation: https://render.com/docs
- Vercel Documentation: https://vercel.com/docs
- Repository: https://github.com/JosOngeri/Ubuntu.git
