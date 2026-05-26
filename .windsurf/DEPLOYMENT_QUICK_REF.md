# Ubuntu HRMS Deployment Quick Reference

## Production URLs

- **Frontend**: https://ubuntu-hrms.vercel.app
- **Backend**: https://ubuntu-hrms-backend.onrender.com
- **Backend Health**: https://ubuntu-hrms-backend.onrender.com/api/health
- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Repository**: https://github.com/JosOngeri/Ubuntu.git

## Environment Variables

### Backend (Render)

**Required:**
```
NODE_ENV=production
PORT=5000
DATABASE_URL=<existing-postgres-url>
POSTGRES_URL=<existing-postgres-url>
JWT_SECRET=<your-secret>
FRONTEND_ORIGIN=https://ubuntu-hrms.vercel.app
FRONTEND_URL=https://ubuntu-hrms.vercel.app
PGSSLMODE=require
PGPOOL_MAX=10
```

**Optional (Email/SMS):**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASS=<your-app-password>
SMTP_FROM_EMAIL=<your-email>
BLESSED_TEXT_API_KEY=<your-api-key>
BLESSED_TEXT_SENDER_ID=<your-sender-id>
```

### Frontend (Vercel)

```
VITE_API_URL=https://ubuntu-hrms-backend.onrender.com/api
```

## Local Development

### Backend
```bash
cd backend
npm install
npm start
```
Uses `backend/.env` with localhost settings

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Uses `frontend/.env.example` with localhost settings

## Deployment Steps

### Deploy to Production

1. **Backend** (Render):
   - Update environment variables in Render dashboard
   - Commit and push to GitHub
   - Render auto-deploys from main branch

2. **Frontend** (Vercel):
   - Update `frontend/.env.production` with production backend URL
   - Commit and push to GitHub
   - Vercel auto-deploys from main branch

### Rollback

**Backend (Render):**
- Go to Render dashboard → Web Service → Deployments
- Find previous successful deployment
- Click "Rollback"

**Frontend (Vercel):**
- Go to Vercel dashboard → Project → Deployments
- Find previous successful deployment
- Click "..." → "Redeploy"

## File Locations

### Backend
- Config: `backend/render.yaml`
- Environment example: `backend/.env.production.example`
- Local environment: `backend/.env`
- CORS config: `backend/app.js`

### Frontend
- Config: `frontend/vercel.json`
- Production environment: `frontend/.env.production`
- Environment example: `frontend/.env.production.example`
- Local environment: `frontend/.env.example`

## Common Commands

### Git
```bash
git add .
git commit -m "deployment message"
git push origin main
```

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run build
npm run preview
```

## Troubleshooting

### CORS Error
- Check `FRONTEND_ORIGIN` in Render matches Vercel domain
- Verify backend `app.js` includes production URL in allowed origins

### Database Connection
- Verify `DATABASE_URL` and `POSTGRES_URL` in Render
- Check `PGSSLMODE=require` is set
- Ensure PostgreSQL database is running

### Build Failure
- Check build logs in Render/Vercel dashboard
- Verify all dependencies in package.json
- Check for missing environment variables

### Environment Variables Not Loading
- Verify exact variable names (case-sensitive)
- Check variables are set in Production environment
- Redeploy after adding variables

## Testing Checklist

### Backend
- [ ] Health check: `https://ubuntu-hrms-backend.onrender.com/api/health`
- [ ] Database connection works
- [ ] Authentication endpoints work
- [ ] CORS allows Vercel frontend

### Frontend
- [ ] Frontend loads at `https://ubuntu-hrms.vercel.app`
- [ ] Can connect to backend API
- [ ] Login/Register works
- [ ] All pages load correctly

### Integration
- [ ] User can register from frontend
- [ ] User can login from frontend
- [ ] Data persists in database
- [ ] All CRUD operations work

## Architecture

```
Frontend (Vercel)
    ↓
Backend API (Render)
    ↓
PostgreSQL (Render - Ubuntu_hrms_db)
```

## Support

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Full Deployment Guide: See `DEPLOYMENT.md`
