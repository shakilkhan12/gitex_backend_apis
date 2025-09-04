import { body } from "express-validator";

export const parkValidations = [
    body('park_Id').trim().notEmpty().withMessage('park id is required'),
    body('park_english_name').trim().notEmpty().withMessage('english name is required'),
    body('park_arabic_name').trim().notEmpty().withMessage('arabic name is required'),
    body('image').trim().notEmpty().withMessage('image is required'),
    body('latitude').trim().isFloat().withMessage('latitude is required'),
    body('longitude').trim().isFloat().withMessage('longitude is required'),
]; 