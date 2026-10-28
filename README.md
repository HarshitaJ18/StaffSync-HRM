# StaffSync - HR Management System

## Requirements
- Node.js installed
- MongoDB running locally, OR a MongoDB Atlas connection string

## 1. Backend setup
Open a terminal in the `server` folder:
```bash
npm install
```
Edit `server/.env` and set `MONGO_URI` to your MongoDB connection string.
For local MongoDB:
```env
MONGO_URI=mongodb://127.0.0.1:27017/staffsync
PORT=5000
```
Start backend:
```bash
npm run dev
```
Expected: `MongoDB connected successfully!` and `StaffSync server running on port 5000`.

## 2. Frontend setup
Open a second terminal in the `client` folder:
```bash
npm install
npm run dev
```
Open the local URL Vite prints, usually http://localhost:5173.

## Features
- Employee list, add, edit, delete
- Attendance records by date
- Mark Present, Absent, or On Leave
- MongoDB persistence

## Important
The backend API is not production-secure yet. Authentication and role-based access control must be added before real company use.
