import express from 'express';
import Prescription from '../models/Prescription.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createPrescriptionValidation, validateId } from '../middleware/validation.js';
import { generatePrescriptionPDF, uploadToS3 } from '../services/file.service.js';

const router = express.Router();

// Create prescription (doctor only)
router.post('/', authenticate, authorize('doctor'), createPrescriptionValidation, async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id }).populate('user');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const { appointmentId, diagnosis, medications, tests, advice, followUpDate } = req.body;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctor._id
    }).populate('patient');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.prescription) {
      return res.status(400).json({ message: 'Prescription already exists' });
    }

    const prescription = new Prescription({
      appointment: appointmentId,
      patient: appointment.patient._id,
      doctor: doctor._id,
      diagnosis,
      medications,
      tests,
      advice,
      followUpDate
    });

    // Generate PDF
    try {
      const pdfBuffer = await generatePrescriptionPDF(prescription, doctor, appointment.patient);
      const pdfUrl = await uploadToS3(pdfBuffer, `prescriptions/${prescription._id}.pdf`);
      prescription.pdfUrl = pdfUrl;
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
    }

    await prescription.save();

    // Update appointment
    appointment.prescription = prescription._id;
    await appointment.save();

    res.status(201).json({ prescription });
  } catch (error) {
    next(error);
  }
});

// Get patient's prescriptions
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const [prescriptions, total] = await Promise.all([
      Prescription.find({ patient: req.user._id, isActive: true })
        .populate({
          path: 'doctor',
          populate: [
            { path: 'user', select: 'firstName lastName' },
            { path: 'department', select: 'name' }
          ]
        })
        .populate('appointment', 'date type')
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Prescription.countDocuments({ patient: req.user._id, isActive: true })
    ]);

    res.json({
      prescriptions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get prescription by ID
router.get('/:id', authenticate, validateId, async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'firstName lastName email phone' },
          { path: 'department', select: 'name' }
        ]
      })
      .populate('patient', 'firstName lastName email phone')
      .populate('appointment', 'date type');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check authorization
    const doctor = await Doctor.findOne({ user: req.user._id });
    const isPatient = prescription.patient._id.toString() === req.user._id.toString();
    const isDoctor = doctor && prescription.doctor._id.toString() === doctor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ prescription });
  } catch (error) {
    next(error);
  }
});

// Update prescription (doctor only)
router.put('/:id', authenticate, authorize('doctor'), validateId, async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const { diagnosis, medications, tests, advice, followUpDate } = req.body;

    const prescription = await Prescription.findOneAndUpdate(
      { _id: req.params.id, doctor: doctor._id },
      { diagnosis, medications, tests, advice, followUpDate },
      { new: true }
    );

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json({ prescription });
  } catch (error) {
    next(error);
  }
});

// Download prescription PDF
router.get('/:id/download', authenticate, validateId, async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName' }
      })
      .populate('patient', 'firstName lastName');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check authorization
    const doctor = await Doctor.findOne({ user: req.user._id });
    const isPatient = prescription.patient._id.toString() === req.user._id.toString();
    const isDoctor = doctor && prescription.doctor._id.toString() === doctor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (prescription.pdfUrl) {
      return res.redirect(prescription.pdfUrl);
    }

    // Generate PDF on-the-fly
    const pdfBuffer = await generatePrescriptionPDF(
      prescription, 
      prescription.doctor, 
      prescription.patient
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription-${prescription._id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

export default router;
