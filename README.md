# Rewards Nomination Evaluator

A simple split frontend/backend project. The existing React + Vite UI is kept in `frontend/`; the API is implemented with FastAPI in `backend/`.

## Project structure

```text
.
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
├── .gitignore
└── README.md
```

## Requirements

- Python 3.10+
- Node.js 20+
- npm

## Run locally

### 1. Start the FastAPI backend

```bash
cd backend
python -m venv .venv

# Windows PowerShell
.venv\\Scripts\\Activate.ps1

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env  # Windows: copy .env.example .env
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Backend endpoints:

- `GET http://localhost:8000/api/health` — health check
- `POST http://localhost:8000/api/evaluate-nomination` — evaluate one nomination
- `POST http://localhost:8000/api/evaluate-batch` — evaluate a list of nominations
- `http://localhost:8000/docs` — interactive API documentation

### 2. Start the React frontend

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env  # Windows: copy .env.example .env
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). The Vite development server proxies `/api` requests to `http://localhost:8000`.

## Separate deployment

Build the frontend with:

```bash
cd frontend
npm install
npm run build
```

Deploy the contents of `frontend/dist/` to your static hosting provider. Deploy the FastAPI application separately using an ASGI server such as Uvicorn. Set `VITE_API_BASE_URL` at frontend build time to the public FastAPI base URL, and set `CORS_ORIGINS` in the backend environment to the frontend origin(s), comma-separated.

Example backend production command:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Evaluation behavior

The API keeps the existing three-factor heuristic evaluation flow (spreadsheet comments, proof documents, and nominator competency) for single and batch evaluation. The frontend's existing screens and client-side file handling remain in place. No Gemini API key is required by this FastAPI version.

## Health check

```bash
curl http://localhost:8000/api/health
```

Expected response:

```json
{"status":"ok","service":"rewards-nomination-evaluator-api"}
```
