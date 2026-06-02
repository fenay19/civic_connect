# 🏛️ Civic Connect

**A modern platform for citizens to submit grievances and connect with their government digitally.**

Civic Connect is an open-source grievance management system that enables citizens to report public issues, track their complaints, and receive updates through multiple channels including web, Telegram, and email. Built with a robust full-stack architecture, it bridges the gap between citizens and civic authorities.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Usage Guide](#usage-guide)
- [Deployment](#deployment)
- [Project Roadmap](#project-roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

Civic Connect is designed to modernize the grievance management process by:

- **Digitizing Complaints**: Replace paper-based grievance systems with a digital-first platform
- **Real-time Tracking**: Citizens can monitor the status of their complaints in real-time
- **Multi-channel Notifications**: Updates via web dashboard, Telegram bot, and email
- **AI-Powered Categorization**: Automatically categorize complaints using Groq AI
- **Secure User Management**: Role-based access control for citizens and administrators
- **Responsive Design**: Mobile-friendly interface for accessibility on all devices

---

## ✨ Key Features

### For Citizens
- 👤 **User Registration & Login**: Secure authentication for personal accounts
- 📝 **Submit Grievances**: Easy-to-use form to file complaints with attachments
- 📊 **Track Complaints**: Real-time status updates and complaint history
- 🔔 **Notifications**: Get updates via web, Telegram, or email
- 📍 **Location-based Complaints**: Use interactive maps to pinpoint issues
- ⭐ **Rate & Review**: Provide feedback on resolution quality

### For Administrators
- 🔐 **Admin Dashboard**: Comprehensive overview of all complaints
- 📈 **Analytics & Reporting**: Visualize complaint metrics and trends
- ✅ **Complaint Management**: Update status, assign priorities, and resolve issues
- 👥 **User Management**: Monitor citizen accounts and activities
- 🤖 **AI-Assisted Responses**: Generate suggested responses using AI
- 🔧 **System Configuration**: Manage categories, departments, and workflows

### Platform Features
- 🌐 **Web Interface**: Modern, responsive React application with Tailwind CSS
- 🤖 **Telegram Integration**: Bot for status updates and real-time notifications
- 📧 **Email Support**: Automated email notifications
- 🔐 **Secure API**: RESTful backend with CORS and input validation
- 💾 **Database**: SQLite with LibSQL for reliable data storage
- 🚀 **Serverless Deployment**: Optimized for Vercel and cloud platforms

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^18.3.1 | UI framework |
| **TypeScript** | ^5.8.3 | Type-safe development |
| **Vite** | ^5.4.19 | Build tool & dev server |
| **Tailwind CSS** | ^3.4.17 | Utility-first styling |
| **Shadcn/ui** | Latest | Component library |
| **React Router** | ^6.30.1 | Client-side routing |
| **React Query** | ^5.83.0 | Data fetching & caching |
| **Leaflet** | ^1.9.4 | Interactive maps |
| **Recharts** | ^2.15.4 | Data visualization |
| **React Hook Form** | ^7.61.1 | Form management |
| **Zod** | ^3.25.76 | Schema validation |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | ES Modules | Runtime environment |
| **Express** | ^4.18.2 | Web framework |
| **LibSQL** | ^0.17.2 | Lightweight database client |
| **Groq SDK** | ^1.1.2 | AI-powered categorization |
| **Telegram Bot API** | ^0.67.0 | Telegram integration |
| **CORS** | ^2.8.5 | Cross-origin requests |
| **Dotenv** | ^17.2.3 | Environment management |
| **Nodemon** | ^3.0.2 (dev) | Auto-reload during development |

### Deployment
- **Vercel**: Serverless deployment for both frontend and backend
- **SQLite + LibSQL**: Cloud-native database solution

---

## 📁 Project Structure

```
civic_connect/
├── backend/                          # Node.js Express API
│   ├── src/
│   │   ├── app.js                   # Express app configuration
│   │   ├── config/                  # Configuration files
│   │   ├── controllers/             # Request handlers
│   │   ├── routes/                  # API routes
│   │   │   ├── complaints.routes.js # Complaint endpoints
│   │   │   └── users.routes.js      # User endpoints
│   │   └── services/                # Business logic
│   │       ├── telegram.service.js  # Telegram bot integration
│   │       ├── groq.service.js      # AI categorization
│   │       └── database.service.js  # Database operations
│   ├── package.json
│   ├── vercel.json                  # Vercel configuration
│   └── .env.example
│
├── frontend/                         # React + TypeScript SPA
│   ├── src/
│   │   ├── App.tsx                  # Main app component
│   │   ├── main.tsx                 # Entry point
│   │   ├── pages/                   # Page components
│   │   │   ├── Index.tsx            # Landing page
│   │   │   ├── SubmitGrievance.tsx  # Complaint form
│   │   │   ├── UserLogin.tsx        # User authentication
│   │   │   ├── UserDashboard.tsx    # Citizen dashboard
│   │   │   ├── AdminDashboard.tsx   # Admin panel
│   │   │   └── NotFound.tsx         # 404 page
│   │   ├── components/              # Reusable components
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utility functions
│   │   ├── types/                   # TypeScript type definitions
│   │   └── index.css                # Global styles
│   ├── package.json
│   ├── tailwind.config.ts           # Tailwind configuration
│   ├── tsconfig.json                # TypeScript configuration
│   ├── vite.config.ts               # Vite configuration
│   ├── vercel.json                  # Vercel configuration
│   └── index.html
│
└── README.md                         # This file
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher): [Download](https://nodejs.org/)
- **npm** (v9 or higher) or **bun**: Package manager
- **Git**: Version control
- **Environment variables**: Create `.env` files for both backend and frontend

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/fenay19/civic_connect.git
cd civic_connect
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your credentials (see Environment Variables section)
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file (if needed)
cp .env.example .env
```

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database (LibSQL)
LIBSQL_URL=libsql://your-database-url
LIBSQL_AUTH_TOKEN=your-auth-token

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token-here

# Groq AI API
GROQ_API_KEY=your-groq-api-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend (.env)

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:5000

# Application Name
VITE_APP_NAME=Civic Connect

# Map Configuration
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

---

## ▶️ Running the Application

### Development Mode

#### Backend

```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

#### Frontend (in a new terminal)

```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### Production Build

#### Backend

```bash
cd backend
npm start
```

#### Frontend

```bash
cd frontend
npm run build
npm run preview
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### User Registration
```
POST /api/users/register
Content-Type: application/json

{
  "email": "citizen@example.com",
  "password": "securepassword",
  "name": "John Citizen",
  "phone": "9876543210"
}

Response: { userId, token, message }
```

#### User Login
```
POST /api/users/login
Content-Type: application/json

{
  "email": "citizen@example.com",
  "password": "securepassword"
}

Response: { token, user: { id, name, email } }
```

#### Admin Login
```
POST /api/users/admin-login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "adminpassword"
}

Response: { token, admin: { id, name, email } }
```

### Complaint Endpoints

#### Submit Complaint
```
POST /api/complaints/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Pothole in Main Street",
  "description": "Large pothole causing accidents",
  "category": "Road Maintenance",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "Main Street, City"
  },
  "attachments": ["base64-encoded-image"]
}

Response: { complaintId, status: "submitted", message }
```

#### Get Complaint Status
```
GET /api/complaints/{complaintId}
Authorization: Bearer {token}

Response: { complaint: { id, title, status, updates, createdAt } }
```

#### List User Complaints
```
GET /api/complaints/user/{userId}
Authorization: Bearer {token}

Response: { complaints: [...], total, page }
```

#### Update Complaint Status (Admin)
```
PUT /api/complaints/{complaintId}/status
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "status": "in-progress",
  "notes": "Assigned to maintenance team"
}

Response: { success, message }
```

### Health Check
```
GET /health
Response: { status: "ok" }
```

---

## 💡 Usage Guide

### For Citizens

1. **Register**: Create an account on the registration page
2. **Submit Grievance**: 
   - Click "Submit Complaint"
   - Fill in the form with complaint details
   - Optionally attach photos/documents
   - Pin the location on the map
   - Submit
3. **Track Status**: 
   - Go to your dashboard
   - View all your complaints
   - See real-time updates
4. **Receive Notifications**:
   - Enable Telegram notifications in settings
   - Receive updates via web notifications
   - Check email for important updates

### For Administrators

1. **Login**: Use admin credentials to access the admin dashboard
2. **View Complaints**:
   - See all pending complaints on the dashboard
   - Filter by status, category, or location
   - Analyze complaint trends with charts
3. **Manage Complaints**:
   - Update complaint status
   - Assign priorities
   - Add notes and comments
   - Generate AI-suggested responses
4. **Generate Reports**: Export complaint data and analytics

---

## 🌐 Deployment

### Deploy Frontend to Vercel

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy Backend to Vercel

```bash
cd backend

# Deploy
vercel
```

### Configure Environment Variables on Vercel

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add all required variables from your `.env` file
4. Redeploy your application

---

## 🗺️ Project Roadmap

### Phase 1 ✅
- [x] Basic user authentication
- [x] Complaint submission form
- [x] Admin dashboard
- [x] Telegram bot integration
- [x] Real-time status tracking

### Phase 2 (In Progress)
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Complaint categorization with ML
- [ ] Mobile app (React Native)
- [ ] Multi-language support

### Phase 3 (Planned)
- [ ] Video submission support
- [ ] AI chatbot for assistance
- [ ] Integration with government systems
- [ ] Community voting on complaints
- [ ] Offline-first mobile experience

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes before submitting
- Update documentation as needed

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙋 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/fenay19/civic_connect/issues)
- **Discussions**: [GitHub Discussions](https://github.com/fenay19/civic_connect/discussions)
- **Email**: Open an issue for contact information

---

## 🙏 Acknowledgments

- Built with [React](https://react.dev), [Express.js](https://expressjs.com), and [Tailwind CSS](https://tailwindcss.com)
- UI Components from [Shadcn/ui](https://ui.shadcn.com)
- AI Categorization powered by [Groq](https://groq.com)
- Database powered by [LibSQL](https://libsql.org)
- Telegram integration via [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)

---

<div align="center">

**Made with ❤️ for better civic engagement**

[⬆ back to top](#-civic-connect)

</div>
