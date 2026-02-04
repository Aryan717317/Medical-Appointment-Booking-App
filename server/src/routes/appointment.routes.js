import express from 'express';
import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Slot from '../models/Slot.js';
import Doctor from '../models/Doctor.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createAppointmentValidation, validateId } from '../middleware/validation.js';
import { createPaymentIntent, capturePayment, cancelPayment } from '../services/payment.service.js';
import { sendAppointmentConfirmation, sendAppointmentCancellation } from '../services/email.service.js';
import { sendSMS } from '../services/sms.service.js';

const router = express.Router();

// Create appointment (patient)
router.post('/', authenticate, createAppointmentValidation, async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { doctorId, slotId, date, type, reason, symptoms } = req.body;

    // Get doctor
    const doctor = await Doctor.findById(doctorId).populate('user').session(session);
    if (!doctor || !doctor.isAcceptingAppointments) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Doctor not available' });
    }

    // Get and lock slot
    const slot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        isAvailable: true,
        isBlocked: false,
        bookedCount: { $lt: mongoose.Types.Decimal128.fromString('1') },
        $or: [
          { 'lock.lockedBy': null },
          { 'lock.expiresAt': { $lt: new Date() } },
          { 'lock.lockedBy': req.user._id }
        ]
      },
      {
        $set: {
          'lock.lockedBy': req.user._id,
          'lock.lockedAt': new Date(),
          'lock.expiresAt': new Date(Date.now() + 5 * 60 * 1000) // 5 min lock
        }
      },
      { new: true, session }
    );

    if (!slot) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Slot not available' });
    }

    // Calculate fee
    const fee = type === 'video' 
      ? (doctor.videoConsultationFee || doctor.consultationFee)
      : doctor.consultationFee;

    // Create payment intent with manual capture
    const paymentIntent = await createPaymentIntent(fee, {
      appointmentType: type,
      doctorId: doctor._id.toString(),
      patientId: req.user._id.toString(),
      slotId: slot._id.toString()
    });

    // Create appointment
    const appointment = new Appointment({
      patient: req.user._id,
      doctor: doctor._id,
      slot: slot._id,
      date: new Date(date),
      startTime: slot.startTime,
      endTime: slot.endTime,
      type,
      reason,
      symptoms,
      payment: {
        status: 'pending',
        amount: fee,
        stripePaymentIntentId: paymentIntent.id
      }
    });

    await appointment.save({ session });

    // Update slot
    slot.bookedCount += 1;
    slot.isAvailable = slot.bookedCount < slot.maxPatients;
    slot.lock = {};
    await slot.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      appointment,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// Confirm payment (after successful payment)
router.post('/:id/confirm-payment', authenticate, validateId, async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user._id
    }).populate({
      path: 'doctor',
      populate: { path: 'user' }
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.payment.status !== 'pending') {
      return res.status(400).json({ message: 'Payment already processed' });
    }

    // Update payment status to held (not captured yet)
    appointment.payment.status = 'held';
    appointment.status = 'confirmed';
    await appointment.save();

    // Send confirmation email
    await sendAppointmentConfirmation(appointment, req.user);

    // Send SMS if phone available
    if (req.user.phone) {
      await sendSMS(
        req.user.phone,
        `MedBook: Your appointment with Dr. ${appointment.doctor.user.lastName} on ${appointment.date.toLocaleDateString()} at ${appointment.startTime} is confirmed.`
      );
    }

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
});

// Get patient's appointments
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const { status, upcoming, page = 1, limit = 10 } = req.query;

    const query = { patient: req.user._id };
    
    if (status) query.status = status;
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
      query.status = { $in: ['pending', 'confirmed'] };
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate({
          path: 'doctor',
          populate: [
            { path: 'user', select: 'firstName lastName email avatar' },
            { path: 'department', select: 'name' }
          ]
        })
        .populate('slot')
        .populate('prescription')
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ date: -1 }),
      Appointment.countDocuments(query)
    ]);

    res.json({
      appointments,
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

// Get single appointment
router.get('/:id', authenticate, validateId, async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'firstName lastName email avatar phone' },
          { path: 'department', select: 'name' }
        ]
      })
      .populate('patient', 'firstName lastName email avatar phone')
      .populate('slot')
      .populate('prescription');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    const doctor = await Doctor.findOne({ user: req.user._id });
    const isPatient = appointment.patient._id.toString() === req.user._id.toString();
    const isDoctor = doctor && appointment.doctor._id.toString() === doctor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
});

// Cancel appointment
router.post('/:id/cancel', authenticate, validateId, async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reason } = req.body;

    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: 'doctor',
        populate: { path: 'user' }
      })
      .session(session);

    if (!appointment) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    const doctor = await Doctor.findOne({ user: req.user._id });
    const isPatient = appointment.patient.toString() === req.user._id.toString();
    const isDoctor = doctor && appointment.doctor._id.toString() === doctor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot cancel this appointment' });
    }

    // Refund payment if held
    if (appointment.payment.status === 'held') {
      await cancelPayment(appointment.payment.stripePaymentIntentId);
      appointment.payment.status = 'refunded';
      appointment.payment.refundedAt = new Date();
    }

    appointment.status = 'cancelled';
    appointment.cancelledBy = isPatient ? 'patient' : (isDoctor ? 'doctor' : 'admin');
    appointment.cancellationReason = reason;
    appointment.cancelledAt = new Date();
    await appointment.save({ session });

    // Release slot
    await Slot.findByIdAndUpdate(
      appointment.slot,
      { $inc: { bookedCount: -1 }, isAvailable: true },
      { session }
    );

    await session.commitTransaction();

    // Send cancellation email
    await sendAppointmentCancellation(appointment, req.user);

    res.json({ appointment });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// Complete appointment (doctor only)
router.post('/:id/complete', authenticate, authorize('doctor'), validateId, async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: doctor._id
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.status !== 'confirmed' && appointment.status !== 'in-progress') {
      return res.status(400).json({ message: 'Cannot complete this appointment' });
    }

    // Capture payment
    if (appointment.payment.status === 'held') {
      await capturePayment(appointment.payment.stripePaymentIntentId);
      appointment.payment.status = 'captured';
      appointment.payment.paidAt = new Date();
    }

    appointment.status = 'completed';
    await appointment.save();

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
});

// Add rating
router.post('/:id/rate', authenticate, validateId, async (req, res, next) => {
  try {
    const { score, review } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user._id,
      status: 'completed'
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or not completed' });
    }

    if (appointment.rating.score) {
      return res.status(400).json({ message: 'Already rated' });
    }

    appointment.rating = {
      score,
      review,
      createdAt: new Date()
    };
    await appointment.save();

    // Update doctor rating
    const doctor = await Doctor.findById(appointment.doctor);
    const newCount = doctor.rating.count + 1;
    const newAverage = ((doctor.rating.average * doctor.rating.count) + score) / newCount;
    
    doctor.rating = {
      average: Math.round(newAverage * 10) / 10,
      count: newCount
    };
    await doctor.save();

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
});

export default router;
