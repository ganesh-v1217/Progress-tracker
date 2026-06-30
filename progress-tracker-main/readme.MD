# Progress Tracker

Progress Tracker is a lightweight study/productivity web app that helps users upload study PDFs, track completion progress, and use a practice timer. It is built as a FastAPI backend (serving an uploads folder and a JSON API) and a React + Vite TypeScript frontend.

**This README documents the project, features, API endpoints, setup/run instructions, and test credentials.**

**Test Credentials:**
- **Username:** `test`
- **Password:** `test`

**Note:** The test credentials above are provided for local testing and demo purposes only.

**Project Summary**
- **Backend:** FastAPI, SQLAlchemy, JWT-based auth, file upload (PDFs stored in `uploads/`).
- **Frontend:** React + TypeScript (Vite), Axios for API calls, components for timer, PDF manager and stats.
- **Database:** Any SQL DB supported by SQLAlchemy (configured via `DATABASE_URL`).

**Repository Structure**
- `server/`: FastAPI backend
  - `app.py`: API routes and main application
  - `auth.py`: password hashing and JWT token creation/verification
  - `database.py`: SQLAlchemy engine, `get_db` dependency, and `Base`
  - `models.py`: ORM models (`User`, `PdfFile`)
  - `schemas.py`: Pydantic schemas used in API (request/response models)
  - `requirements.txt`: Python dependencies
  - `uploads/`: directory where uploaded PDFs are saved (served at `/uploads`)
- `client/`: React + TypeScript frontend (Vite)
  - `src/api.ts`: Axios instance with token interceptor
  - `src/components/`: `PDFManager`, `ProgressStats`, `ClockTimer`, `Navbar`
  - `src/pages/`: `Login`, `Signup`, `Dashboard`
  - `package.json`, `tsconfig.json`, `vite.config.ts`
- `readme.MD`: this file

**Key Features & Functionality**
- **User Authentication:** Sign up and login using username/password. Backend returns a JWT access token used for authenticated API requests.
- **PDF Upload & Management:** Users can upload PDFs (stored in `uploads/`), view them in-browser, mark them as completed/uncompleted, and delete them.
- **Progress Tracking:** Backend computes progress (total PDFs, completed PDFs, completion percentage) and frontend displays overall completion and a simple daily activity chart.
- **Practice Timer:** A configurable countdown timer component for focused study sessions with start/pause/reset and completion alert.
- **Protected API:** All PDF-related endpoints require an Authorization header with a Bearer JWT.

**Backend — API Reference**
All backend endpoints are served by the FastAPI app in `server/app.py`. The base URL defaults to `http://localhost:8000` (changeable by running server on a different host/port).

- **POST /signup**
  - **Description:** Create a new user account.
  - **Request body:** JSON `UserCreate` (fields used: `name`, `email`, `username`, `password`).
  - **Response:** `Token` — `{ "access_token": "<jwt>", "token_type": "bearer" }`.

- **POST /login**
  - **Description:** Login with `username` and `password`.
  - **Request body:** JSON `{ "username": "...", "password": "..." }`.
  - **Response:** `Token` — JWT access token.

- **POST /upload_pdf** (Authenticated)
  - **Description:** Upload a PDF file. Accepts `multipart/form-data` with a `file` field.
  - **Response:** `PdfFile` object with fields like `id`, `filename`, `filepath`, `upload_time`, `completed`.

- **GET /pdfs** (Authenticated)
  - **Description:** List all PDFs uploaded by the current user.
  - **Response:** Array of `PdfFile` objects.

- **PUT /pdfs/{pdf_id}/toggle** (Authenticated)
  - **Description:** Toggle completed/uncompleted status for the specified PDF. If marking complete, `completed_at` is set.
  - **Response:** Updated `PdfFile` object.

- **DELETE /pdfs/{pdf_id}** (Authenticated)
  - **Description:** Delete a PDF resource (removes DB row and file from `uploads/`).
  - **Response:** `204 No Content` on success.

- **GET /progress** (Authenticated)
  - **Description:** Returns aggregated progress statistics for the current user.
  - **Response:** `ProgressResponse` — `{ total_pdfs, completed_pdfs, progress_percentage }`.

- **GET /completed_pdfs_in_particular_day/{completed_at}** (Authenticated)
  - **Description:** Return PDFs marked completed on the given date. Date format: `YYYY-MM-DD`.
  - **Response:** Array of `PdfFile` objects filtered by `completed_at` range for that day.

Authentication details:
- The backend uses JWT (HS256). Tokens are created in `server/auth.py` and expire after 30 minutes by default.
- Send the token in the `Authorization` header: `Authorization: Bearer <token>`.

Example cURL requests
- Login (get token):
```powershell
curl -X POST "http://localhost:8000/login" -H "Content-Type: application/json" -d '{"username":"test","password":"test"}'
```
- Upload PDF (replace `<TOKEN>` and `file.pdf`):
```powershell
curl -X POST "http://localhost:8000/upload_pdf" -H "Authorization: Bearer <TOKEN>" -F "file=@file.pdf"
```
- Get PDFs:
```powershell
curl -X GET "http://localhost:8000/pdfs" -H "Authorization: Bearer <TOKEN>"
```

**Frontend**
- The frontend is a Vite React TypeScript app located in `client/`.
- `src/api.ts` creates an Axios instance pointed at `VITE_BASE_URL` (defaults to `http://localhost:8000`) and automatically attaches the JWT token from `localStorage` to outgoing requests.
- Important pages/components:
  - `Login` and `Signup`: handle authentication and save `access_token` to `localStorage` under `token` key.
  - `Dashboard`: composes `Navbar`, `ClockTimer`, `ProgressStats`, and `PDFManager`.
  - `PDFManager`: upload/view/delete/toggle PDFs.
  - `ProgressStats`: calls `/progress` and attempts to show daily counts (note: some daily-stat calls in the component reference endpoints that may require small frontend fixups — see Troubleshooting).

Environment / Configuration
- Backend `server/` expects the following environment variables (typically in a `.env` file at `server/.env` or in your shell environment):
  - `DATABASE_URL`: SQLAlchemy connection string (required). Example for SQLite (quick local test, change code if using SQLite): `sqlite:///./test.db` (note: the current `database.py` requires `DATABASE_URL` and will raise if missing).
  - `SECRET_KEY` (optional): overrides default JWT secret from `server/auth.py`.

- Frontend `client/` supports this env var:
  - `VITE_BASE_URL`: Base URL for API (defaults to `http://localhost:8000`). Example: `VITE_BASE_URL=http://localhost:8000`.

Installation & Run (Windows PowerShell)
Prerequisites: Python 3.9+, Node.js 16+, and a SQL database accessible via `DATABASE_URL`.

1) Backend — create venv, install, set env vars, run:
```powershell
cd .\server
py -3 -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Create a .env file or set environment variables
# Example .env contents (create server\.env):
# DATABASE_URL="sqlite:///./progress_tracker.db"    # example for SQLite file
# SECRET_KEY="change_this_in_production"

# Export env vars in PowerShell (if you prefer not to use .env):
$env:DATABASE_URL = "sqlite:///./progress_tracker.db"
$env:SECRET_KEY = "supersecretkey"

# Run the app with uvicorn
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Notes:
- `database.py` currently requires `DATABASE_URL` environment variable. For quick local testing you can point it to a local PostgreSQL or change to a local SQLite connection string like `sqlite:///./progress_tracker.db` (and ensure path/permissions). If switching DB types, ensure the correct DB driver is installed (`psycopg2-binary` for Postgres, SQLite is included with Python).

2) Frontend — install and run:
```powershell
cd ..\client
npm install
# Optionally set VITE_BASE_URL then run dev server
$env:VITE_BASE_URL = "http://localhost:8000"
npm run dev
```

Open the frontend in the browser (Vite shows the dev URL, usually `http://localhost:5173`).

Test Accounts
- Use the provided test account to quickly sign in during development: username `test` / password `test`.
- If the user does not already exist in the database, create it by using the Signup page or calling `POST /signup` with these credentials.

Troubleshooting & Notes
- If you see an error complaining `DATABASE_URL environment variable is not set`, set `DATABASE_URL` (see steps above).
- If file uploads do not appear or `uploads/` 404, ensure the backend is running in the repository root (so the `uploads/` folder path resolves correctly) and the `uploads` directory exists — the backend attempts to create it on start.
- If JWT authentication fails, confirm `SECRET_KEY` matches between your environment and any produced tokens. The code uses a default in `server/auth.py` when not set.
- CORS is enabled for `http://localhost:5173` and `https://progress-tracker-user-interface.onrender.com`. If you run the frontend at a different origin, add it to the `origins` list in `server/app.py`.

Development & Next Steps
- Add a dedicated statistics endpoints (per-day completed counts) to simplify `ProgressStats` calculations in the frontend.
- Add user profile endpoints and password reset flows for production readiness.
- Add tests (pytest) for backend routes and frontend component tests.

License & Security
- This project is a demo/starter app. Do not use the default `SECRET_KEY` or the sample test credentials in production.

If you'd like, I can:
- Run a quick patch to add a `server/.env.example` with recommended variables.
- Add a small script to seed the test user automatically.

---

Generated on: 2025-12-04
