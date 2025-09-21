# Footfall Analysis API Documentation

## Overview
This document provides comprehensive details about the enhanced footfall analysis services for both Parks and Offices, including detailed employee and guest tracking with demographic breakdowns.

## Table of Contents
1. [API Endpoints](#api-endpoints)
2. [Request/Response Structures](#requestresponse-structures)
3. [Data Models](#data-models)
4. [Validation Rules](#validation-rules)
5. [Example Usage](#example-usage)
6. [Database Schema](#database-schema)

---

## API Endpoints

### 1. Park Footfall Analysis

#### Get Park Footfall Analysis
```
GET /api/parks/footfall-analysis
```

**Query Parameters:**
- `parkIds` (number | number[]): Single park ID or array of park IDs
- `fromDate` (string, optional): Start date in ISO format (YYYY-MM-DD)
- `toDate` (string, optional): End date in ISO format (YYYY-MM-DD)

**Example Request:**
```
GET /api/parks/footfall-analysis?parkIds=1&fromDate=2024-01-01&toDate=2024-01-31
```

#### Add Park Footfall Analysis
```
POST /api/parks/footfall-analysis
```

**Request Body:**
```json
{
  "park_Id": 1,
  "detection_Id": "DET_001_20240115_143022",
  "person_Id": 123,  // Optional - null for guests
  "gender": "M",     // "M", "F", "Male", "Female"
  "is_child": false,
  "detected_camera_Id": "CAM_001",
  "detected_camera_name": "Main Entrance Camera",
  "time": "2024-01-15T14:30:22.000Z",
  "abc1": "additional_data_1",
  "abc2": "additional_data_2",
  "abc3": "additional_data_3"
}
```

### 2. Office Footfall Analysis

#### Get Office Footfall Analysis
```
GET /api/offices/footfall-analysis
```

**Query Parameters:**
- `officeIds` (number | number[]): Single office ID or array of office IDs
- `fromDate` (string, optional): Start date in ISO format (YYYY-MM-DD)
- `toDate` (string, optional): End date in ISO format (YYYY-MM-DD)

**Example Request:**
```
GET /api/offices/footfall-analysis?officeIds=1&fromDate=2024-01-01&toDate=2024-01-31
```

#### Add Office Footfall Analysis
```
POST /api/offices/footfall-analysis
```

**Request Body:**
```json
{
  "office_Id": 1,
  "detection_Id": "DET_001_20240115_143022",
  "person_Id": 123,  // Optional - null for guests
  "gender": "F",     // "M", "F", "Male", "Female"
  "is_child": false,
  "detected_camera_Id": "CAM_001",
  "detected_camera_name": "Reception Camera",
  "time": "2024-01-15T14:30:22.000Z"
}
```

---

## Request/Response Structures

### Response Structure (Both Parks and Offices)

```json
{
  "summary": {
    "totalFootfall": 150,
    "employeeCount": 80,
    "employeeMaleCount": 45,
    "employeeFemaleCount": 35,
    "employeeChildrenCount": 5,
    "guestCount": 70,
    "guestMaleCount": 40,
    "guestFemaleCount": 30,
    "guestChildrenCount": 8
  },
  "employees": [
    {
      "Id": 123,
      "emp_Id": "EMP123",
      "emp__eng_name": "John Doe",
      "emp__arabic_name": "جون دو",
      "gender": "M",
      "image": "employee_image_url"
    }
  ],
  "guests": [
    {
      "detection_Id": "DET_001_20240115_143022",
      "guest_Id": "GUEST_DET_001_20240115_143022",
      "guest_eng_name": "Guest DET_001_20240115_143022",
      "guest_arabic_name": "زائر DET_001_20240115_143022",
      "gender": "F",
      "is_child": false,
      "detected_camera_Id": "CAM_001",
      "detected_camera_name": "Main Entrance Camera",
      "time": "2024-01-15T14:30:22.000Z"
    }
  ],
  "hourlyDistribution": {
    "0": { "total": 5, "employees": 2, "guests": 3 },
    "1": { "total": 3, "employees": 1, "guests": 2 },
    "2": { "total": 2, "employees": 0, "guests": 2 },
    "8": { "total": 25, "employees": 20, "guests": 5 },
    "9": { "total": 30, "employees": 25, "guests": 5 },
    "12": { "total": 15, "employees": 10, "guests": 5 },
    "18": { "total": 20, "employees": 15, "guests": 5 }
  },
  "dailyDistribution": {
    "2024-01-15": { "total": 150, "employees": 80, "guests": 70 },
    "2024-01-16": { "total": 200, "employees": 120, "guests": 80 },
    "2024-01-17": { "total": 180, "employees": 100, "guests": 80 }
  },
  "rawData": [
    {
      "id": 1,
      "park_Id": 1,
      "detection_Id": "DET_001_20240115_143022",
      "person_Id": 123,
      "gender": "M",
      "is_child": false,
      "time": "2024-01-15T14:30:22.000Z",
      "detected_camera_Id": "CAM_001",
      "detected_camera_name": "Main Entrance Camera",
      "abc1": "additional_data_1",
      "abc2": "additional_data_2",
      "abc3": "additional_data_3",
      "park": {
        "Id": 1,
        "park_english_name": "Central Park",
        "park_arabic_name": "الحديقة المركزية"
      }
    }
  ]
}
```

---

## Data Models

### ParkFootfallAnalysisType
```typescript
interface ParkFootfallAnalysisType {
  park_Id: number;
  detection_Id: string;
  person_Id?: number | null;  // Optional for guest entries
  gender?: string;            // "M", "F", "Male", "Female"
  is_child?: boolean;
  detected_camera_Id: string;
  detected_camera_name?: string;
  time?: Date;
  abc1?: string;
  abc2?: string;
  abc3?: string;
}
```

### OfficeFootfallAnalysisType
```typescript
interface OfficeFootfallAnalysisType {
  office_Id: number;
  detection_Id: string;
  person_Id?: number | null;  // Optional for guest entries
  gender?: string;            // "M", "F", "Male", "Female"
  is_child?: boolean;
  detected_camera_Id: string;
  detected_camera_name?: string;
  time?: Date;
}
```

---

## Validation Rules

### Required Fields
- `park_Id` / `office_Id`: Must be a valid number
- `detection_Id`: Must be a non-empty string
- `detected_camera_Id`: Must be a non-empty string

### Optional Fields
- `person_Id`: Can be null for guest entries
- `gender`: "M", "F", "Male", or "Female"
- `is_child`: Boolean, defaults to false
- `detected_camera_name`: String
- `time`: ISO 8601 date string, defaults to current time
- `abc1`, `abc2`, `abc3`: Additional data fields (parks only)

### Validation Examples

#### Valid Employee Entry
```json
{
  "park_Id": 1,
  "detection_Id": "EMP_DET_001",
  "person_Id": 123,
  "gender": "M",
  "is_child": false,
  "detected_camera_Id": "CAM_001",
  "detected_camera_name": "Main Entrance",
  "time": "2024-01-15T14:30:22.000Z"
}
```

#### Valid Guest Entry
```json
{
  "park_Id": 1,
  "detection_Id": "GUEST_DET_001",
  "person_Id": null,
  "gender": "F",
  "is_child": false,
  "detected_camera_Id": "CAM_001",
  "detected_camera_name": "Main Entrance",
  "time": "2024-01-15T14:30:22.000Z"
}
```

---

## Example Usage

### JavaScript/TypeScript Examples

#### Fetch Park Footfall Analysis
```javascript
const fetchParkFootfall = async (parkId, fromDate, toDate) => {
  const params = new URLSearchParams({
    parkIds: parkId.toString(),
    fromDate: fromDate,
    toDate: toDate
  });
  
  const response = await fetch(`/api/parks/footfall-analysis?${params}`);
  const data = await response.json();
  
  console.log('Total Footfall:', data.summary.totalFootfall);
  console.log('Employees:', data.summary.employeeCount);
  console.log('Guests:', data.summary.guestCount);
  console.log('Employee Males:', data.summary.employeeMaleCount);
  console.log('Guest Females:', data.summary.guestFemaleCount);
  
  return data;
};
```

#### Add Footfall Entry
```javascript
const addFootfallEntry = async (entryData) => {
  const response = await fetch('/api/parks/footfall-analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entryData)
  });
  
  return await response.json();
};

// Example usage
const newEntry = {
  park_Id: 1,
  detection_Id: "DET_001_" + Date.now(),
  person_Id: null, // Guest entry
  gender: "M",
  is_child: false,
  detected_camera_Id: "CAM_001",
  detected_camera_name: "Main Entrance",
  time: new Date().toISOString()
};

await addFootfallEntry(newEntry);
```

### Python Examples

#### Fetch Office Footfall Analysis
```python
import requests
from datetime import datetime, timedelta

def fetch_office_footfall(office_id, from_date=None, to_date=None):
    params = {
        'officeIds': office_id,
        'fromDate': from_date,
        'toDate': to_date
    }
    
    response = requests.get('/api/offices/footfall-analysis', params=params)
    data = response.json()
    
    print(f"Total Footfall: {data['summary']['totalFootfall']}")
    print(f"Employees: {data['summary']['employeeCount']}")
    print(f"Guests: {data['summary']['guestCount']}")
    
    return data

# Example usage
data = fetch_office_footfall(
    office_id=1,
    from_date='2024-01-01',
    to_date='2024-01-31'
)
```

---

## Database Schema

### parks_footfall_analysis Table
```sql
CREATE TABLE parks_footfall_analysis (
  id INT PRIMARY KEY AUTO_INCREMENT,
  park_Id INT,
  detection_Id VARCHAR(255) NOT NULL,
  person_Id INT NULL,  -- NULL for guests
  gender VARCHAR(10),
  is_child BOOLEAN DEFAULT FALSE,
  time DATETIME DEFAULT NOW(),
  detected_camera_Id VARCHAR(255),
  detected_camera_name VARCHAR(255),
  abc1 VARCHAR(255),
  abc2 VARCHAR(255),
  abc3 VARCHAR(255),
  FOREIGN KEY (park_Id) REFERENCES parks(Id),
  FOREIGN KEY (person_Id) REFERENCES users(Id)
);
```

### offices_footfall_analysis Table
```sql
CREATE TABLE offices_footfall_analysis (
  id INT PRIMARY KEY AUTO_INCREMENT,
  office_Id INT,
  detection_Id VARCHAR(255) NOT NULL,
  person_Id INT NULL,  -- NULL for guests
  gender VARCHAR(10),
  is_child BOOLEAN DEFAULT FALSE,
  time DATETIME DEFAULT NOW(),
  detected_camera_Id VARCHAR(255),
  detected_camera_name VARCHAR(255),
  FOREIGN KEY (office_Id) REFERENCES offices(Id),
  FOREIGN KEY (person_Id) REFERENCES users(Id)
);
```

---

## Key Features

### 1. Employee vs Guest Classification
- **Employees**: Records with `person_Id` (linked to users table)
- **Guests**: Records with `person_Id = null`

### 2. Demographic Breakdown
- **Gender**: Male/Female counts for both employees and guests
- **Age**: Child counts for both employees and guests
- **Time-based**: Hourly and daily distributions with employee/guest breakdowns

### 3. Analytics Features
- **Unique Tracking**: Separate lists of unique employees and guests
- **Time Analysis**: Peak hours and daily patterns
- **Demographic Insights**: Gender and age distribution analysis
- **Camera Tracking**: Detection source and location data

### 4. Data Integrity
- **Validation**: Comprehensive input validation
- **Flexibility**: Support for both employee and guest entries
- **Consistency**: Same logic across parks and offices services

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "status": 400,
  "message": "office_Id is required"
}
```

#### 500 Internal Server Error
```json
{
  "status": 500,
  "message": "Failed to fetch footfall analysis data"
}
```

### Error Scenarios
1. Missing required fields
2. Invalid date formats
3. Database connection issues
4. Invalid park/office IDs

---

## Performance Considerations

### Optimization Tips
1. **Date Filtering**: Always use date ranges for large datasets
2. **Indexing**: Ensure proper database indexes on `time`, `park_Id`, `office_Id`, and `person_Id`
3. **Pagination**: Consider implementing pagination for large result sets
4. **Caching**: Cache frequently accessed analytics data

### Recommended Indexes
```sql
-- Parks table indexes
CREATE INDEX idx_parks_footfall_time ON parks_footfall_analysis(time);
CREATE INDEX idx_parks_footfall_park_id ON parks_footfall_analysis(park_Id);
CREATE INDEX idx_parks_footfall_person_id ON parks_footfall_analysis(person_Id);

-- Offices table indexes
CREATE INDEX idx_offices_footfall_time ON offices_footfall_analysis(time);
CREATE INDEX idx_offices_footfall_office_id ON offices_footfall_analysis(office_Id);
CREATE INDEX idx_offices_footfall_person_id ON offices_footfall_analysis(person_Id);
```

---

## Migration Notes

### Breaking Changes
1. **person_Id**: Now optional (can be null for guests)
2. **Response Structure**: Enhanced with detailed employee/guest breakdowns
3. **Distribution Format**: Changed from simple counts to detailed objects

### Backward Compatibility
- Existing API endpoints remain the same
- Response structure is enhanced but maintains core fields
- Database schema supports both old and new data formats

---

This documentation provides all the necessary details for developers to integrate with the enhanced footfall analysis services. The APIs now support comprehensive employee and guest tracking with detailed demographic analytics and time-based insights.

