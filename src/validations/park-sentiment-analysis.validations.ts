import { body } from "express-validator";

export const parkSentimentAnalysisValidations = [
    body('park_Id')
        .isString()
        .withMessage('Park ID must be a valid string'),
    
    body('person_Id')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Employee ID must not exceed 255 characters'),
    
    body('detection_Id')
        .trim()
        .notEmpty()
        .withMessage('Detection ID is required')
        .isLength({ max: 100 })
        .withMessage('Detection ID must not exceed 100 characters'),
    
    body('gender')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Gender must not exceed 50 characters'),
    
    body('check_in_image')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Check in image must not exceed 255 characters'),
    
    body('check_in_date')
        .isISO8601()
        .withMessage('Check in date must be a valid date'),
    
    body('check_in_time')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .withMessage('Check in time must be in HH:MM:SS format'),
    
    body('check_in_sentiment')
        .trim()
        .notEmpty()
        .withMessage('Check in sentiment is required')
        .isLength({ max: 50 })
        .withMessage('Check in sentiment must not exceed 50 characters')
        // .isIn(['positive', 'negative', 'neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted'])
        // .withMessage('Check in sentiment must be one of: positive, negative, neutral, happy, sad, angry, surprised, fearful, disgusted')
        ,
    
    body('entry_camera_Id')
        .isString()
        .withMessage('Entry camera ID must be a valid string'),
]

export const parkSentimentAnalysisUpdateValidations = [
    body('detection_Id')
        .trim()
        .notEmpty()
        .withMessage('Detection ID is required')
        .isLength({ max: 100 })
        .withMessage('Detection ID must not exceed 100 characters'),
    
    body('check_out_date')
        .optional()
        .isISO8601()
        .withMessage('Check out date must be a valid date'),
    
    body('check_out_time')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .withMessage('Check out time must be in HH:MM:SS format'),
    
    body('check_out_capture')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Check out capture must not exceed 255 characters'),
    
    body('check_out_sentiment')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Check out sentiment must not exceed 50 characters'),
    
    body('exit_camera_Id')
        .optional()
        .isString()
        .withMessage('Exit camera ID must be a valid string'),
]