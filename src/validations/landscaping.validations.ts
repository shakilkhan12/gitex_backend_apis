import { body } from "express-validator";

export const landscapingValidations = [
    body('image')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Image URL must not exceed 500 characters'),
    
    body('name')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Name must not exceed 255 characters'),
    
    body('status')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Status must not exceed 100 characters'),
    
    body('suggestion')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Suggestion must not exceed 1000 characters'),
]; 