import { body } from "express-validator";

export const userValidations = [
    body('EmpCode').trim().notEmpty().withMessage('Employee code is required'),
    body('Password').trim().notEmpty().withMessage('Password is required'),
];

export const userLoginValidations = [
    body('EmpCode').trim().notEmpty().withMessage('Employee code is required'),
    body('Password').trim().notEmpty().withMessage('Password is required'),
];

export const addUserValidations = [
    body('unique_id')
        .trim()
        .notEmpty()
        .withMessage('Unique ID is required')
        .isLength({ max: 255 })
        .withMessage('Unique ID must not exceed 255 characters'),
    
    body('user_Id')
    .trim()
    .notEmpty()
    .isLength({ max: 255 })
    .withMessage('Unique ID must not exceed 255 characters'),
    
    body('emp_Id')
        .trim()
        .notEmpty()
        .withMessage('Employee ID is required')
        .isLength({ max: 255 })
        .withMessage('Employee ID must not exceed 255 characters'),
    
    body('emp_code')
        .trim()
        .notEmpty()
        .withMessage('Employee code is required')
        .isLength({ max: 255 })
        .withMessage('Employee code must not exceed 255 characters'),
    
    body('image')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Image URL must not exceed 500 characters')
        .isURL()
        .withMessage('Image must be a valid URL'),
    
    body('gender')
        .trim()
        .notEmpty()
        .withMessage('Gender is required')
        .isLength({ max: 50 })
        .withMessage('Gender must not exceed 50 characters'),
    
    body('emp__eng_name')
        .trim()
        .notEmpty()
        .withMessage('Employee English name is required')
        .isLength({ max: 255 })
        .withMessage('Employee English name must not exceed 255 characters'),
    
    body('location')
        .trim()
        .notEmpty()
        .withMessage('Location is required')
        .isLength({ max: 255 })
        .withMessage('Location must not exceed 255 characters'),
    
    body('telephone')
        .trim()
        .notEmpty()
        .withMessage('Telephone is required')
        .isLength({ max: 20 })
        .withMessage('Telephone must not exceed 20 characters'),
    
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Email must be a valid email address')
        .isLength({ max: 255 })
        .withMessage('Email must not exceed 255 characters'),
    
    body('office_extension')
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage('Office extension must not exceed 10 characters'),
    
    body('nationality')
        .trim()
        .notEmpty()
        .withMessage('Nationality is required')
        .isLength({ max: 100 })
        .withMessage('Nationality must not exceed 100 characters'),
    
    body('joining_date')
        .isISO8601()
        .withMessage('Joining date must be a valid date'),
    
    body('date_of_birth')
        .isISO8601()
        .withMessage('Date of birth must be a valid date'),
    
    body('dep_eng_name')
        .trim()
        .notEmpty()
        .withMessage('Department English name is required')
        .isLength({ max: 255 })
        .withMessage('Department English name must not exceed 255 characters'),
    
    body('desig_eng_name')
        .trim()
        .notEmpty()
        .withMessage('Designation English name is required')
        .isLength({ max: 255 })
        .withMessage('Designation English name must not exceed 255 characters'),
    
    body('unit_arabic_name')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Unit Arabic name must not exceed 255 characters'),
    
    body('is_attendance_user')
        .optional()
        .isBoolean()
        .withMessage('is_attendance_user must be a boolean'),
    
    body('is_ai_login_user')
        .optional()
        .isBoolean()
        .withMessage('is_ai_login_user must be a boolean'),
    
    body('ai_engine_access')
        .optional()
        .isBoolean()
        .withMessage('ai_engine_access must be a boolean'),
];