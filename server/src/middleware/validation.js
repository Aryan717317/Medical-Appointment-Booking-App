import { validationResult, body, param, query } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: errors.array().map(e => e.msg)
    });
  }
  next();
};

// Auth validators
export const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  validate
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

// Appointment validators
export const createAppointmentValidation = [
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
  body('slotId').isMongoId().withMessage('Valid slot ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('type').isIn(['in-person', 'video']).withMessage('Invalid appointment type'),
  validate
];

// Slot validators
export const createSlotValidation = [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid start time required (HH:MM)'),
  body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid end time required (HH:MM)'),
  validate
];

// Prescription validators
export const createPrescriptionValidation = [
  body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
  body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required'),
  body('medications').isArray({ min: 1 }).withMessage('At least one medication is required'),
  body('medications.*.name').trim().notEmpty().withMessage('Medication name is required'),
  body('medications.*.dosage').trim().notEmpty().withMessage('Medication dosage is required'),
  body('medications.*.frequency').trim().notEmpty().withMessage('Medication frequency is required'),
  body('medications.*.duration').trim().notEmpty().withMessage('Medication duration is required'),
  validate
];

// ID param validator
export const validateId = [
  param('id').isMongoId().withMessage('Valid ID is required'),
  validate
];

// Pagination validator
export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validate
];
