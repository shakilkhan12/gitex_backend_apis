import { body } from "express-validator";

export const behaviorAlertsValidations = [
    body('park_Id')
        .isInt({ min: 1 })
        .withMessage('Park ID must be a valid positive integer'),
    
    body('person_Id')
        .trim()
        .notEmpty()
        .withMessage('Person ID is required')
        .isLength({ max: 255 })
        .withMessage('Person ID must not exceed 255 characters'),
    
    body('camera_Id')
        .isInt({ min: 1 })
        .withMessage('Camera ID must be a valid positive integer'),
    
    body('detected_behaviour')
        .trim()
        .notEmpty()
        .withMessage('Detected behaviour is required')
        .isLength({ max: 255 })
        .withMessage('Detected behaviour must not exceed 255 characters')
        // .isIn(['fighting', 'vandalism', 'trespassing', 'suspicious_activity', 'crowding', 'other'])
        // .withMessage('Detected behaviour must be one of: fighting, vandalism, trespassing, suspicious_activity, crowding, other'),
        ,
    
    body('snap_shot')
        .trim()
        .notEmpty()
        .withMessage('Snap shot is required')
        .isLength({ max: 255 })
        .withMessage('Snap shot must not exceed 255 characters'),
]; 