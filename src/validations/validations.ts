import { body, param  } from "express-validator";
export const parkValidations = [
    body('park_Id').trim().notEmpty().withMessage('park id is required'),
    // body('park_english_name').trim().notEmpty().withMessage('english name is required'),
    // body('park_arabic_name').trim().notEmpty().withMessage('arabic name is required'),
    // body('image').trim().notEmpty().withMessage('image is required'),
    // body('latitude').trim().isFloat().withMessage('latitude is required'),
    // body('longitude').trim().isFloat().withMessage('longitude is required'),
]
export const parkBasicInfoValidations = [
    body('park_Id').trim().notEmpty().withMessage('park id is required'),
    // body('park_english_name').trim().notEmpty().withMessage('english name is required'),
    // body('park_arabic_name').trim().notEmpty().withMessage('arabic name is required'),
    // body('location').trim().notEmpty().withMessage('location is required'),
]
export const officeBasicInfoValidations = [
    body('office_Id').trim().notEmpty().withMessage('office id is required')
]
export const parkCameraValidations = [
    body('park_Id').notEmpty().withMessage("park_Id is required").isInt({min: 1}).withMessage('park id must be valid integer'),
    body('camera_Id').trim().notEmpty().withMessage('camera id is required'),
    // body('camera_english_name').trim().notEmpty().withMessage('camera english name is required'),
    // body('camera_arabic_name').trim().notEmpty().withMessage('camera arabic name is required'),
    // body('latitude').trim().isFloat().withMessage('latitude is required'),
    // body('longitude').trim().isFloat().withMessage('longitude is required'),
    // body('ip_address').trim().notEmpty().withMessage('ip address is required'),
    // body('last_active_date').notEmpty().withMessage("last active date is required")
    // .isISO8601().withMessage("Invalid date format (use YYYY-MM-DD)").toDate(),
    // body('last_active_time').notEmpty().withMessage("last active time is required")
    // .matches(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    // .withMessage("Invalid time format, must be HH:mm:ss"),
    // body('status').trim().notEmpty().withMessage('status is required')
]
export const officeValidations = [
    body('office_Id').trim().notEmpty().withMessage('office id is required'),
]
export const officeCameraValidations = [
    body('office_Id').notEmpty().withMessage("office Id is required").isInt({min: 1}).withMessage('office id must be valid integer'),
    body('camera_Id').trim().notEmpty().withMessage('camera id is required'),
    // body('camera_english_name').trim().notEmpty().withMessage('camera english name is required'),
    // body('camera_arabic_name').trim().notEmpty().withMessage('camera arabic name is required'),
    // body('latitude').trim().isFloat().withMessage('latitude is required'),
    // body('longitude').trim().isFloat().withMessage('longitude is required'),
    // body('ip_address').trim().notEmpty().withMessage('ip address is required'),
    // body('last_active_date').notEmpty().withMessage("last active date is required")
    // .isISO8601().withMessage("Invalid date format (use YYYY-MM-DD)").toDate(),
    // body('last_active_time').notEmpty().withMessage("last active time is required")
    // .matches(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    // .withMessage("Invalid time format, must be HH:mm:ss"),
    // body('status').trim().notEmpty().withMessage('status is required')
]

export const zoneValidations = [
    body('park_Id').notEmpty().withMessage("park Id is required").isInt({min: 1}).withMessage('park id must be valid integer'),
    body('zone_Id').trim().notEmpty().withMessage('zone id is required'),
    body('zone_english_name').trim().notEmpty().withMessage('zone english name is required'),
    body('zone_arabic_name').trim().notEmpty().withMessage('zone arabic name is required'),
    body('latitude').trim().isFloat().withMessage('latitude is required'),
    body('longitude').trim().isFloat().withMessage('longitude is required'),
    body('device_ip').trim().notEmpty().withMessage('device ip is required'),
    body('web_api').notEmpty().withMessage("web api is required")

]

// validators/faq.validator.ts

export const createFAQValidator = [
  body().isArray().withMessage("FAQs must be an array"),

  body("*.question")
    .notEmpty().withMessage("Question is required")
    .isString().withMessage("Question must be a string")
    .isLength({ min: 5 }).withMessage("Question must be at least 5 characters"),

  body("*.answer")
    .notEmpty().withMessage("Answer is required")
    .isString().withMessage("Answer must be a string")
    .isLength({ min: 5 }).withMessage("Answer must be at least 5 characters"),
];

export const updateFAQValidator = [
body().isArray().withMessage("FAQs must be an array"),

  body("*.id")
    .optional()
    .isInt({ gt: 0 }).withMessage("FAQ id must be a positive integer"),

  body("*.question")
    .notEmpty().withMessage("Question is required")
    .isString().withMessage("Question must be a string")
    .isLength({ min: 5 }).withMessage("Question must be at least 5 characters"),

  body("*.answer")
    .notEmpty().withMessage("Answer is required")
    .isString().withMessage("Answer must be a string")
    .isLength({ min: 5 }).withMessage("Answer must be at least 5 characters"),
];
export const createOrUpdateTermsPrivacyValidator = [
  body("terms")
    .optional()
    .isString().withMessage("Terms must be a string")
    .isLength({ min: 10 }).withMessage("Terms must be at least 10 characters long"),

  body("privacyPolicy")
    .optional()
    .isString().withMessage("Privacy Policy must be a string")
    .isLength({ min: 10 }).withMessage("Privacy Policy must be at least 10 characters long"),

  body().custom((value, { req }) => {
    if (!req.body.terms && !req.body.privacyPolicy) {
      throw new Error("You must provide either terms or privacyPolicy");
    }
    return true;
  })
];
