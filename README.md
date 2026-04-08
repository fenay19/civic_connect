# Problem Statement

**PS 12 : AI for Grievance Redressal in Public Governance**

Public governance bodies receive thousands of citizen grievances every day related to civic infrastructure, sanitation, public safety, utilities, healthcare, education, and administrative delays.

These grievances are often:
- Unstructured (free-text, voice notes, mixed languages)
- Manually reviewed and routed
- Slow to resolve, leading to backlogs and citizen dissatisfaction

The lack of intelligent prioritization and analysis causes critical grievances to be delayed, while authorities struggle to extract meaningful insights from large volumes of complaint data.

There is a pressing need for an AI-powered grievance redressal system that can intelligently understand, categorize, and prioritize citizen complaints to enable faster, fairer, and more transparent governance.

---

# Project Name

Citizen Connect – AI-Powered Grievance Redressal System

---

# Team Name

Team Intellect

---

# Deployed Link

Frontend:  
https://citizen-connect-six.vercel.app/

Backend API:  
https://citizen-connect-backend-aiu3.onrender.com/

---

# 2-Minute Demonstration Video Link

https://drive.google.com/drive/folders/1knRClhN2u-CBH7qUJ7PA629wvuqqO6QF?usp=sharing

---

# Project Overview

Citizen Connect is a full-stack grievance redressal platform that enables citizens to submit complaints easily while allowing government authorities to manage, analyze, and resolve grievances efficiently.

The platform uses AI-powered Natural Language Processing (NLP) to automatically categorize grievances, determine priority levels, analyze sentiment, and assist administrators in faster decision-making.

A centralized admin dashboard, interactive maps, and analytics promote transparency, accountability, and data-driven governance.

---

# Key Features

- Online grievance submission with location and image support
- AI-based grievance categorization, prioritization, and sentiment analysis
- Interactive map displaying complaint hotspots
- Admin dashboard with analytics and trend insights
- Bilingual support (English & Hindi)
- Secure and scalable database using Supabase
- Real-time grievance status tracking

---

# Tech Stack

## Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- Leaflet (OpenStreetMap)
- shadcn/ui

## Backend
- Node.js
- Express.js
- Supabase (PostgreSQL)

## NLP / AI Service
- Python
- FastAPI
- Sentence Transformers
- scikit-learn

---

# Setup and Installation Instructions

## Prerequisites
- Node.js 18+
- Python 3.8+
- Supabase account

---

## Quick Start (Recommended)

Two scripts are provided to start **Frontend, Backend, and NLP Service together**.

### For Linux / macOS
```bash
./start-all.sh
````

### For Windows

```bash
start-all.bat
```

These scripts start:

* NLP Service on port 8000
* Backend on port 5000
* Frontend on port 8080

---

## Backend Environment Configuration

Navigate to the backend folder and create a `.env` file:

```bash
cd backend
```

Create `.env` with the following content:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
NLP_SERVICE_URL=http://localhost:8000
PORT=5000
NODE_ENV=development
```

> Note: Use the **Supabase service_role key**, not the anon key.

---

## Manual Setup (Alternative)

### Step 1: NLP Service

```bash
cd nlp-services
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### Step 2: Backend & Frontend

```bash
npm run install:all
npm run dev
```

---

# API Endpoints

* GET /api/complaints
* GET /api/complaints/:id
* POST /api/complaints
* PATCH /api/complaints/:id

---

# How This Helps the Government

* Automatically categorizes and prioritizes grievances
* Reduces manual workload for officials
* Ensures critical issues are addressed first
* Provides real-time analytics and insights
* Improves transparency and accountability
* Enables faster grievance resolution and better citizen satisfaction

---
