## CitySnap

Full-stack civic issue reporting app.

### Repo structure

```text
citysnap/
  server/   (Express + MongoDB + Cloudinary + Roboflow + Nodemailer)
  client/   (React + Vite + Tailwind + Leaflet + Recharts)
```

### Quick start (local)

Prereqs:
- Node.js 18+
- MongoDB running locally (`mongodb://localhost:27017`)

1) Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

2) Frontend

```bash
cd client
npm install
npm run dev
```

Backend: `http://localhost:5000`  
Frontend: `http://localhost:5173`

### Authority accounts

Users can only self-register as `civilian`. To create an authority, register normally then update the user’s `role` in MongoDB (see “After building” section in the assistant message).

