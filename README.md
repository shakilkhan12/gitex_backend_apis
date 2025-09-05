# Gitex API's

## Description

This repository provides a starter template for building applications with Express.js, TypeScript, and Mongoose. It sets up a structured project architecture, allowing you to quickly start developing robust and scalable applications with TypeScript's type safety and Mongoose's powerful MongoDB object modeling.

## Installation

### 1. Clone the repository:

```bash
git clone https://github.com/shakilkhan12/gitex_backend_apis
```

### 2. Navigate into the project directory:

```bash
cd folder_name
```

### 3. Install dependencies:

```bash
npm install
```

## Usage

### Run Prisma Migrations

```bash
npm run prisma-migrate
```

### Generate Prisma Client

```bash
npm run prisma-gen
```

### Starting the Development Server

```bash
npm run dev
```

## API Documentation

The API documentation is available via Swagger UI at:

- **Development**: http://localhost:5000/api-docs
- **Production**: https://api.khorfakkan.gov.ae/api-docs

### Available API Endpoints

#### Parks Management
- `POST /api/parks/add` - Add a new park
- `GET /api/parks/get` - Get all parks

#### Smoking Detection
- `POST /api/smoking-detection/add` - Add a new smoking detection record
- `GET /api/smoking-detection/get` - Get all smoking detection records

#### Litter Detection
- `POST /api/litter-detection/add` - Add a new litter detection record
- `GET /api/litter-detection/get` - Get all litter detection records

#### Landscaping
- `POST /api/landscaping/add` - Add a new landscaping record
- `GET /api/landscaping/get` - Get all landscaping records

#### Behavior Alerts
- `POST /api/behavior-alerts/add` - Add a new behavior alert record
- `GET /api/behavior-alerts/get` - Get all behavior alert records

#### Office Sentiment Analysis
- `POST /api/office-sentiment-analysis/add` - Add a new office sentiment analysis record
- `GET /api/office-sentiment-analysis/get` - Get all office sentiment analysis records

#### Park Sentiment Analysis
- `POST /api/park-sentiment-analysis/add` - Add a new park sentiment analysis record
- `GET /api/park-sentiment-analysis/get` - Get all park sentiment analysis records

#### Office Attendance
- `POST /api/office-attendance/add` - Add a new office attendance record
- `GET /api/office-attendance/get` - Get all office attendance records

#### Park Attendance
- `POST /api/park-attendance/add` - Add a new park attendance record
- `GET /api/park-attendance/get` - Get all park attendance records

## Configuration

Environment variables can be configured using a `.env` file in the root directory. Refer to `.env.test` for a list of variables and their default values.
