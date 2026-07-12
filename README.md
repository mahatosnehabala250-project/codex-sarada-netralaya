# Sarada Netralaya

Premium eye care website and owner appointment dashboard for Sarada Netralaya, Jamshedpur.

## Features

- Modern English-only eye care website
- Online appointment booking with unique reference number
- Owner login dashboard for appointment review
- Appointment status updates: requested, confirmed, completed, cancelled
- Owner search, status filter, CSV export, and print view
- Google Maps directions and quick call/book actions

## Local Setup

```bash
cd frontend
npm install
npm run dev
```

In another terminal:

```bash
cd backend
npm install
npm start
```

## Environment

Create `backend/.env` from `backend/.env.example`.

For production, set strong values for `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `APP_SECRET`.
