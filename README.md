# iot-device-dashboard

Full-stack IoT monitoring platform.  
The **Node.js + Express** backend (TypeScript) persists environmental telemetry for up to 17 devices in MongoDB and exposes a JWT-secured REST API.  
The **React + Vite** frontend (TypeScript, Material-UI) handles authentication, renders a real-time dashboard and device health cards fed by `/api/data` endpoints.

---

## Technologies

| Layer      | Stack / Tools                                                |
|------------|--------------------------------------------------------------|
| Backend    | Node.js 18, Express 4, TypeScript, Mongoose, JWT, Nodemon    |
| Frontend   | React 18, Vite, TypeScript, Material-UI, React-Router        |
| Database   | MongoDB Atlas / local MongoDB instance                       |
| Dev Utils  | ts-node-dev / nodemon (hot reload), ESLint, Prettier         |

---

## Project structure

```text
iot-device-dashboard/
├── api/                      # backend
│   ├── lib/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── modules/
│   │   └── services/
│   ├── public/               # static assets if any
│   ├── config.ts
│   ├── index.ts
│   ├── nodemon.json
│   ├── package.json
│   └── tsconfig.json
├── client/                   # frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   └── components/
│   ├── index.html
│   ├── vite-env.d.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│── screenshots/
└── README.md                 # <— you are here
