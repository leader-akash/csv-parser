# CSV Upload, Validation & Reporting System

A full-stack web application for uploading, validating, and reporting on CSV files with 10,000+ rows.

## Tech Stack

### Frontend
- **Framework:** Next.js 16
- **Styling:** Tailwind CSS 4
- **Language:** JavaScript (ES6+)

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **CSV Parsing:** csv-parser (streaming)
- **File Upload:** Multer

## Features

- CSV file upload with drag & drop support
- Real-time upload progress bar
- Streaming CSV parsing for handling large files (10,000+ rows)
- Row-by-row validation with detailed error messages
- Results dashboard with statistics
- Failed records table with pagination (50 items per page)
- Search functionality for failed records
- Filter by error type (name, email, phone errors)
- Download failed records as CSV

## Validation Rules

### Name
- Required field
- Minimum 2 characters
- Must not contain special characters or numbers

### Email
- Required field
- Must be valid email format (example@domain.com)
- Disposable email domains are not allowed

### Phone
- Required field
- Must be exactly 10 digits
- Must contain only numbers
- Must start with 6, 7, 8, or 9

## Project Structure

```
/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   └── app/
│   │       ├── page.js       # Upload page
│   │       ├── results/
│   │       │   └── page.js   # Results dashboard
│   │       ├── layout.js     # Root layout
│   │       └── globals.css   # Global styles
│   └── package.json
├── backend/                  # Express.js backend API
│   ├── src/
│   │   ├── index.js          # Server entry point
│   │   ├── routes/
│   │   │   └── upload.js     # Upload route
│   │   ├── controllers/
│   │   │   └── csvController.js  # CSV processing logic
│   │   └── utils/
│   │       └── validators.js # Validation functions
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 20+ installed
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Documentation

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### Upload CSV

```
POST /api/upload
```

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (CSV file)

**CSV Format:**
```csv
name,email,phone
John Doe,john@example.com,9876543210
Jane Smith,jane@example.com,8765432109
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalRecords": 10000,
    "validCount": 8700,
    "invalidCount": 1300,
    "failedRecords": [
      {
        "rowNumber": 2,
        "name": "Raj",
        "email": "invalid-email",
        "phone": "987654321",
        "errors": ["Invalid email format"]
      },
      {
        "rowNumber": 3,
        "name": "",
        "email": "sam@example.com",
        "phone": "9876543210",
        "errors": ["Name is required"]
      }
    ]
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Only CSV files are allowed"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "message": "Error processing CSV file"
}
```

## Sample CSV Data

Create a test CSV file with the following format:

```csv
name,email,phone
John Doe,john@example.com,9876543210
Jane Smith,jane@example.com,8765432109
Invalid User,invalid-email,12345
,missing@name.com,9876543210
Test User,test@tempmail.com,9876543210
```

## Performance

- Uses streaming CSV parsing to handle large files efficiently
- Does not block the event loop during processing
- Memory-efficient processing of 10,000+ row files
- Frontend pagination prevents rendering performance issues

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
