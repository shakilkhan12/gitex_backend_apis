import { body } from "express-validator";

export const officeAttendanceValidations = [
    body('office_Id')
        .isInt({ min: 1 })
        .withMessage('Office ID must be a valid positive integer'),
    
    body('person_Id')
        .trim()
        .notEmpty()
        .withMessage('Person ID is required')
        .isLength({ max: 255 })
        .withMessage('Person ID must not exceed 255 characters'),
    
    body('attendance_of')
        .trim()
        .notEmpty()
        .withMessage('Attendance of is required')
        .isIn(['employee', 'visitor'])
        .withMessage('Attendance of must be either employee or visitor'),
    
    body('check_in_date')
        .isISO8601()
        .withMessage('Check in date must be a valid date'),
    
    body('check_in_time')
        .isISO8601()
        .withMessage('Check in time must be a valid time'),
    
    body('check_out_date')
        .optional()
        .isISO8601()
        .withMessage('Check out date must be a valid date'),
    
    body('check_out_time')
        .optional()
        .isISO8601()
        .withMessage('Check out time must be a valid time'),
    
    body('snap_shot')
        .trim()
        .notEmpty()
        .withMessage('Snap shot is required')
        .isLength({ max: 255 })
        .withMessage('Snap shot must not exceed 255 characters'),
    
    body('mood')
        .trim()
        .notEmpty()
        .withMessage('Mood is required')
        .isLength({ max: 50 })
        .withMessage('Mood must not exceed 50 characters')
        // .isIn(['happy', 'sad', 'angry', 'neutral', 'excited', 'tired', 'stressed', 'relaxed', 'focused', 'distracted'])
        // .withMessage('Mood must be one of: happy, sad, angry, neutral, excited, tired, stressed, relaxed, focused, distracted')
        ,
]; 