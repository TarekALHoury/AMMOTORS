# AMMOTORS

A basic car dealership starter project with a React + Vite frontend and a Node.js + Express backend. Car data is currently stored in a local JSON file.

## Project structure

```text
AMMOTORS/
├── frontend/   # React application
└── backend/    # Express API and cars.json
```

## Requirements

- Node.js 20 or newer
- npm

## Run the backend

Open a terminal in the project root:

```bash
cd backend
npm install
npm run dev
```

The API runs at `http://localhost:5000`.

- `GET /api/cars` returns all cars.
- `GET /api/cars/:id` returns one car by ID.

## Run the frontend

Open a second terminal in the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). Keep the backend running while using the frontend.

## Production build

To check the frontend production build:

```bash
cd frontend
npm run build
```
