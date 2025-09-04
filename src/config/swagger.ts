import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Khorfakkan Smart City API',
      version: '1.0.0',
      description: 'API documentation for Khorfakkan Smart City Management System',
      contact: {
        name: 'API Support',
        email: 'support@khorfakkan.gov.ae'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.khorfakkan.gov.ae/api',
        description: 'Production server'
      }
    ],
    components: {
      schemas: {
        Park: {
          type: 'object',
          properties: {
            Id: { type: 'integer', example: 1 },
            park_Id: { type: 'string', example: 'PARK001' },
            park_english_name: { type: 'string', example: 'Central Park' },
            park_arabic_name: { type: 'string', example: 'الحديقة المركزية' },
            image: { type: 'string', example: 'park_image.jpg' },
            latitude: { type: 'number', format: 'decimal', example: 25.3314 },
            longitude: { type: 'number', format: 'decimal', example: 56.3419 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        SmokingDetection: {
          type: 'object',
          properties: {
            Id: { type: 'integer', example: 1 },
            park_Id: { type: 'integer', example: 1 },
            location: { type: 'string', example: 'Main Entrance Area' },
            camera_Id: { type: 'integer', example: 5 },
            occurrence_date: { type: 'string', format: 'date', example: '2024-01-15' },
            occurrence_time: { type: 'string', format: 'time', example: '14:30:00' },
            snap_shot: { type: 'string', example: 'smoking_detection_20240115_143000.jpg' },
            posted_to_intranet_date: { type: 'string', format: 'date', example: '2024-01-15' },
            posted_to_intranet_time: { type: 'string', format: 'time', example: '14:35:00' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        LitterDetection: {
          type: 'object',
          properties: {
            Id: { type: 'integer', example: 1 },
            park_Id: { type: 'integer', example: 1 },
            case_Id: { type: 'string', example: 'LITTER_20240115_001' },
            location: { type: 'string', example: 'Playground Area' },
            occurrence_date: { type: 'string', format: 'date', example: '2024-01-15' },
            occurrence_time: { type: 'string', format: 'time', example: '10:30:00' },
            snap_shot: { type: 'string', example: 'litter_detection_20240115_103000.jpg' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'resolved', 'closed'], example: 'pending' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Landscaping: {
          type: 'object',
          properties: {
            Id: { type: 'integer', example: 1 },
            park_Id: { type: 'integer', example: 1 },
            case_Id: { type: 'string', example: 'LANDSCAPE_20240115_001' },
            location: { type: 'string', example: 'Garden Area' },
            snap_shot: { type: 'string', example: 'landscaping_20240115_001.jpg' },
            type: { type: 'string', example: 'Irrigation' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'resolved', 'closed'], example: 'pending' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        BehaviorAlert: {
          type: 'object',
          properties: {
            Id: { type: 'integer', example: 1 },
            park_Id: { type: 'integer', example: 1 },
            person_Id: { type: 'string', example: 'PERSON001' },
            camera_Id: { type: 'integer', example: 5 },
            detected_behaviour: { type: 'string', example: 'Unauthorized access' },
            snap_shot: { type: 'string', example: 'behavior_alert_20240115_001.jpg' },
            detection_Id: { type: 'string', example: 'BEHAVIOR_20240115_001' },
            detection_code: { type: 'string', example: 'UNAUTH_ACCESS' },
            detection_date: { type: 'string', format: 'date', example: '2024-01-15' },
            detection_time: { type: 'string', format: 'time', example: '10:30:00' },
            description: { type: 'string', example: 'Unauthorized access detected in restricted area' },
            is_employee: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        OfficeSentimentAnalysis: {
          type: 'object',
          properties: {
            Id: { type: 'integer', example: 1 },
            office_Id: { type: 'integer', example: 1 },
            person_Id: { type: 'string', example: 'PERSON001' },
            sentiment_of: { type: 'string', enum: ['employee', 'visitor'], example: 'employee' },
            check_in_date: { type: 'string', format: 'date', example: '2024-01-15' },
            check_in_time: { type: 'string', format: 'time', example: '09:00:00' },
            check_in_sentiment: { type: 'string', example: 'Happy' },
            entry_camera_Id: { type: 'integer', example: 5 },
            check_out_date: { type: 'string', format: 'date', example: '2024-01-15' },
            check_out_time: { type: 'string', format: 'time', example: '17:00:00' },
            check_out_capture: { type: 'string', example: 'checkout_20240115_170000.jpg' },
            exit_camera_Id: { type: 'integer', example: 6 },
            detection_Id: { type: 'string', example: 'SENTIMENT_20240115_001' },
            person_name: { type: 'string', example: 'John Smith' },
            person_image: { type: 'string', example: 'person_20240115_001.jpg' },
            gender: { type: 'string', example: 'Male' },
            check_in_image: { type: 'string', example: 'checkin_20240115_090000.jpg' },
            check_out_sentiment: { type: 'string', example: 'Satisfied' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ParkSentimentAnalysis: {
          type: 'object',
          properties: {
            Id: { type: 'integer', example: 1 },
            park_Id: { type: 'integer', example: 1 },
            person_Id: { type: 'string', example: 'PERSON001' },
            sentiment_of: { type: 'string', enum: ['employee', 'visitor'], example: 'visitor' },
            check_in_date: { type: 'string', format: 'date', example: '2024-01-15' },
            check_in_time: { type: 'string', format: 'time', example: '10:00:00' },
            check_in_sentiment: { type: 'string', example: 'Excited' },
            entry_camera_Id: { type: 'integer', example: 5 },
            check_out_date: { type: 'string', format: 'date', example: '2024-01-15' },
            check_out_time: { type: 'string', format: 'time', example: '18:00:00' },
            check_out_capture: { type: 'string', example: 'checkout_20240115_180000.jpg' },
            exit_camera_Id: { type: 'integer', example: 6 },
            detection_Id: { type: 'string', example: 'SENTIMENT_20240115_001' },
            person_name: { type: 'string', example: 'Jane Doe' },
            person_image: { type: 'string', example: 'person_20240115_001.jpg' },
            gender: { type: 'string', example: 'Female' },
            check_in_image: { type: 'string', example: 'checkin_20240115_100000.jpg' },
            check_out_sentiment: { type: 'string', example: 'Very Happy' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        OfficeAttendance: {
          type: 'object',
          properties: {
            Id: { type: 'integer', example: 1 },
            office_Id: { type: 'integer', example: 1 },
            person_Id: { type: 'string', example: 'PERSON001' },
            attendance_of: { type: 'string', enum: ['employee', 'visitor'], example: 'employee' },
            check_in_date: { type: 'string', format: 'date', example: '2024-01-15' },
            check_in_time: { type: 'string', format: 'time', example: '09:00:00' },
            check_out_date: { type: 'string', format: 'date', example: '2024-01-15' },
            check_out_time: { type: 'string', format: 'time', example: '17:00:00' },
            snap_shot: { type: 'string', example: 'attendance_20240115_001.jpg' },
            mood: { type: 'string', example: 'Happy' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ParkAttendance: {
          type: 'object',
          properties: {
            Id: { type: 'integer', example: 1 },
            park_Id: { type: 'integer', example: 1 },
            person_Id: { type: 'integer', example: 1 },
            entry_time: { type: 'string', format: 'date-time', example: '2024-01-15T10:00:00Z' },
            exit_time: { type: 'string', format: 'date-time', example: '2024-01-15T18:00:00Z' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        User: {
          type: 'object',
          properties: {
            Id: { type: 'integer', example: 1 },
            emp_Id: { type: 'string', example: 'EMP001' },
            emp__eng_name: { type: 'string', example: 'John Smith' },
            emp__arabic_name: { type: 'string', example: 'جون سميث' },
            gender: { type: 'string', example: 'Male' },
            country_code: { type: 'string', example: '+971' },
            phone: { type: 'string', example: '501234567' },
            email: { type: 'string', example: 'john.smith@example.com' },
            dep_eng_name: { type: 'string', example: 'IT Department' },
            dep_arabic_name: { type: 'string', example: 'قسم تقنية المعلومات' },
            desig_eng_name: { type: 'string', example: 'Software Engineer' },
            desig_arabic_name: { type: 'string', example: 'مهندس برمجيات' },
            unit_eng_name: { type: 'string', example: 'Development Unit' },
            unit_arabic_name: { type: 'string', example: 'وحدة التطوير' },
            committe_eng_name: { type: 'string', example: 'Technical Committee' },
            committe_arabic_name: { type: 'string', example: 'اللجنة التقنية' },
            ai_engine_access: { type: 'boolean', example: true },
            last_login: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        AccessSecret: {
          type: 'object',
          properties: {
            Id: { type: 'integer', example: 1 },
            value: { type: 'string', example: 'secret_key_value' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Error message' },
            status: { type: 'integer', example: 400 }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

export const specs = swaggerJsdoc(options); 