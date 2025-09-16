# Cloudinary Setup for Event Handler

## Environment Variables Required

Add these environment variables to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## How to Get Cloudinary Credentials

1. Sign up for a free Cloudinary account at https://cloudinary.com
2. Go to your Dashboard
3. Copy the following values:
   - **Cloud Name**: Found in the "Account Details" section
   - **API Key**: Found in the "Account Details" section  
   - **API Secret**: Found in the "Account Details" section

## Image Storage Structure

Images will be stored in Cloudinary with the following structure:
```
event-images/
├── intrusion/
│   └── {eventId}_{timestamp}.jpg
└── behavior/
    └── {eventId}_{timestamp}.jpg
```

## Features

- ✅ Automatic image optimization (quality: auto, format: auto)
- ✅ Unique file naming with timestamps
- ✅ Organized folder structure by event type
- ✅ Secure HTTPS URLs returned
- ✅ Error handling for failed uploads
- ✅ Comprehensive logging

## Usage

The event handler will automatically:
1. Fetch base64 image from HikVision API
2. Upload to Cloudinary
3. Store the returned URL in the database
4. Log the entire process for debugging
