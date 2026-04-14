# Deployment Notes

## Frontend on Vercel

Set:

- Framework preset: `Vite`
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:
  - `VITE_API_BASE_URL=https://your-heroku-app.herokuapp.com/api`

## Backend on Heroku

Set:

- Root directory: `backend`
- Start command: `npm start`
- Config vars:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `CORS_ORIGIN`
  - `NODE_ENV=production`

## MongoDB Atlas

1. Create a cluster.
2. Create an app user.
3. Copy the Atlas connection string into `MONGODB_URI`.
4. Allow Heroku connectivity.

## Recommended next implementation steps

1. Replace placeholder resource controllers with real Mongoose CRUD.
2. Add request validation.
3. Add password hashing during user creation/update.
4. Finish the CSV migration script and run it once.
5. Port PDF generation into the backend.
