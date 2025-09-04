import { body } from "express-validator";

export const parkSentimentAnalysisValidations = [
    body('park_Id')
        .isInt({ min: 1 })
        .withMessage('Park ID must be a valid positive integer'),
    
    body('person_Id')
        .trim()
        .notEmpty()
        .withMessage('Person ID is required')
        .isLength({ max: 255 })
        .withMessage('Person ID must not exceed 255 characters'),
    
    body('sentiment_of')
        .trim()
        .notEmpty()
        .withMessage('Sentiment of is required')
        .isIn(['employee', 'visitor'])
        .withMessage('Sentiment of must be either employee or visitor'),
    
    body('check_in_date')
        .isISO8601()
        .withMessage('Check in date must be a valid date'),
    
    body('check_in_time')
        .isISO8601()
        .withMessage('Check in time must be a valid time'),
    
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
        .isInt({ min: 1 })
        .withMessage('Entry camera ID must be a valid positive integer'),
    
    body('check_out_date')
        .optional()
        .isISO8601()
        .withMessage('Check out date must be a valid date'),
    
    body('check_out_time')
        .optional()
        .isISO8601()
        .withMessage('Check out time must be a valid time'),
    
    body('check_out_capture')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Check out capture must not exceed 255 characters'),
    
    body('exit_camera_Id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Exit camera ID must be a valid positive integer'),
]; 