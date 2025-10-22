# FindMoney - Personal Spending Analysis

A full-stack React application for analyzing and categorizing personal spending transactions with a SQLite backend.

## Features

- 📊 Visual spending analysis with interactive charts
- 🏷️ Smart transaction categorization with merchant rules
- 📁 Data export functionality
- 📄 PDF statement processing (planned)
- 📱 Responsive design with Tailwind CSS
- 🔥 Hot module replacement for rapid development

## Architecture

**Frontend:**
- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Recharts for data visualization
- Lucide React for icons

**Backend:**
- Express.js server (Node.js)
- SQLite database with better-sqlite3
- RESTful API architecture
- Auto-reloading with nodemon

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

**Run with hot reloading (recommended):**
```bash
npm run dev:fullstack
```

This starts:
- Backend server on `http://localhost:3001`
- Frontend dev server on `http://localhost:3000` (with HMR)
- API requests automatically proxied from frontend to backend

Access the app at: [http://localhost:3000](http://localhost:3000)

**Run separately:**
```bash
# Terminal 1 - Backend with auto-reload
npm run dev:backend

# Terminal 2 - Frontend with HMR
npm run dev
```

### Production

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run server
   ```

The server will serve the built frontend and API from port 3001.

## Available Scripts

- `npm run dev:fullstack` - Run both frontend (HMR) and backend (auto-reload)
- `npm run dev` - Start Vite dev server only (port 3000)
- `npm run dev:backend` - Start backend with nodemon (port 3001)
- `npm run server` - Start production server
- `npm run build` - Build frontend for production
- `npm run build:fullstack` - Build and start production server
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Endpoints

- `GET /api/transactions` - Get all transactions
- `PUT /api/transactions/category/bulk` - Update category for all transactions from a merchant
- `GET /api/categories` - Get all categories
- `GET /api/categories/summary` - Get category spending summary
- `GET /api/statements` - Get all uploaded statements
- `GET /api/merchant-rules` - Get merchant categorization rules
- `POST /api/merchant-rules` - Create/update merchant rule
- `GET /api/merchant-rules/export` - Export categorization rules
- `GET /api/health` - Health check endpoint

## Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React

**Backend:**
- Express.js
- SQLite (better-sqlite3)
- Node.js
- dotenv for configuration
- CORS enabled
