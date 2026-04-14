# Sales Press Brake Web Migration

This folder contains the starter web stack for migrating the Qt desktop app to:

- `Vue 3 + Vite` on Vercel
- `Express + Node.js` on Heroku
- `MongoDB Atlas`

## Structure

- `backend/` API, MongoDB models, migration script skeleton
- `frontend/` Vue app scaffold with router, stores, and views

## Local setup

1. Update `backend/.env` with your MongoDB Atlas connection string and JWT secret.
2. Keep `frontend/.env` pointing at `http://localhost:5000/api` for local development.
3. Start the backend from `backend/` with `npm start`.
4. Start the frontend from `frontend/` with `npm run dev`.
5. Run the migration once with `npm run migrate:csv` from `backend/` after Atlas is configured.

## Suggested rollout

1. Build and test the backend locally.
2. Configure MongoDB Atlas.
3. Run the CSV migration script.
4. Build the Vue admin and app flows.
5. Deploy backend to Heroku.
6. Deploy frontend to Vercel.

## Important notes

- The backend is the only component that should talk to MongoDB.
- Passwords should be migrated into hashes, not stored as plain text.
- Quote data in MongoDB should use structured arrays instead of delimiter strings.
