# Deployment Guide

This project is split into:

- `frontend`: Vue 3 + Vite, deployed to `Vercel`
- `backend`: Node.js + Express, deployed to `Heroku`
- `database`: local MongoDB for development, `MongoDB Atlas` when you are ready for production

## 1. Frontend Deployment on Vercel

Create a new Vercel project and point it at this repository with:

- Framework preset: `Vite`
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

Set this environment variable in Vercel:

- `VITE_API_BASE_URL=https://your-heroku-app.herokuapp.com/api`

This frontend is a Vue SPA, so direct refreshes on nested routes need a rewrite rule. That is handled by `frontend/vercel.json`.

## 2. Backend Deployment on Heroku

Create a Heroku app for the backend and deploy the `backend` folder.

Required config vars:

- `NODE_ENV=production`
- `PORT=5001`
- `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sales_pressbrake`
- `JWT_SECRET=your-long-random-secret`
- `CORS_ORIGIN=https://your-frontend.vercel.app`

If you want to keep local preview URLs working temporarily, you can allow more than one origin:

- `CORS_ORIGIN=http://localhost:5173,https://your-frontend.vercel.app`

The backend already includes a `Procfile` with:

```text
web: npm start
```

After deployment, confirm the API is live:

- `https://your-heroku-app.herokuapp.com/api/health`

## 3. MongoDB Atlas Later

You can keep using local MongoDB while developing. When you move to production:

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Add the Heroku app to Atlas network access, or temporarily allow wider access during setup.
4. Copy the Atlas connection string into Heroku as `MONGODB_URI`.

The application code already reads the database URL from environment variables, so moving from local MongoDB to Atlas is just a config change.

## 4. Production Checklist

Before pushing production:

1. Build the frontend locally with `npm run build` inside `frontend`
2. Start the backend locally with production-like env values
3. Confirm login works
4. Confirm admin CRUD works
5. Confirm recommendation flow works
6. Confirm quote save and PDF export work
7. Confirm the frontend can talk to the deployed backend through `CORS_ORIGIN`

## 5. Recommended First Deployment Order

1. Push this repository to GitHub
2. Deploy the backend to Heroku
3. Verify `/api/health`
4. Deploy the frontend to Vercel
5. Set `VITE_API_BASE_URL` in Vercel
6. Update `CORS_ORIGIN` in Heroku with the final Vercel URL
7. Smoke-test the live app
