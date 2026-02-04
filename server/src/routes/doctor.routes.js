import express from 'express';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { validateId, paginationValidation } from '../middleware/validation.js';

const router = express.Router();

// Get all doctors (public)
router.get('/', optionalAuth, paginationValidation, async (req, res, next) => {
  try {
    const { 
      department, 
      specialization, 
      search,
      minRating,
      maxFee,
      page = 1, 
      limit = 10 
    } = req.query;

    const query = { isAcceptingAppointments: true };

    if (department) query.department = department;
    if (specialization) query.specialization = new RegExp(specialization, 'i');
    if (minRating) query['rating.average'] = { $gte: Number(minRating) };
    if (maxFee) query.consultationFee = { $lte: Number(maxFee) };

    let doctorsQuery = Doctor.find(query)
      .populate('user', 'firstName lastName email avatar')
      .populate('department', 'name')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ 'rating.average': -1 });

    if (search) {
      doctorsQuery = Doctor.find({
        ...query,
        $text: { $search: search }
      })
        .populate('user', 'firstName lastName email avatar')
        .populate('department', 'name')
        .skip((page - 1) * limit)
        .limit(Number(limit));
    }

    const [doctors, total] = await Promise.all([
      doctorsQuery,
      Doctor.countDocuments(query)
    ]);

    res.json({
      doctors,
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

// Get doctor by ID (public)
router.get('/:id', validateId, async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'firstName lastName email avatar phone')
      .populate('department', 'name description');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json({ doctor });
  } catch (error) {
    next(error);
  }
});

// Get doctor's appointments (doctor only)
router.get('/my/appointments', authenticate, authorize('doctor'), async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const { status, date, page = 1, limit = 10 } = req.query;
    
    const query = { doctor: doctor._id };
    if (status) query.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('patient', 'firstName lastName email phone avatar')
        .populate('slot')
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ date: 1, startTime: 1 }),
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

// Get doctor's profile (doctor only)
router.get('/my/profile', authenticate, authorize('doctor'), async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
      .populate('user', 'firstName lastName email phone avatar')
      .populate('department', 'name');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json({ doctor });
  } catch (error) {
    next(error);
  }
});

// Update doctor profile (doctor only)
router.put('/my/profile', authenticate, authorize('doctor'), async (req, res, next) => {
  try {
    const allowedUpdates = [
      'bio', 'languages', 'availability', 'slotDuration',
      'isAcceptingAppointments', 'consultationFee', 'videoConsultationFee'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true }
    )
      .populate('user', 'firstName lastName email phone avatar')
      .populate('department', 'name');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json({ doctor });
  } catch (error) {
    next(error);
  }
});

// Get doctor stats (doctor only)
router.get('/my/stats', authenticate, authorize('doctor'), async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalAppointments,
      todayAppointments,
      completedAppointments,
      pendingAppointments,
      totalEarnings
    ] = await Promise.all([
      Appointment.countDocuments({ doctor: doctor._id }),
      Appointment.countDocuments({ 
        doctor: doctor._id, 
        date: { $gte: today, $lt: new Date(today.getTime() + 86400000) }
      }),
      Appointment.countDocuments({ doctor: doctor._id, status: 'completed' }),
      Appointment.countDocuments({ doctor: doctor._id, status: { $in: ['pending', 'confirmed'] } }),
      Appointment.aggregate([
        { $match: { doctor: doctor._id, 'payment.status': 'captured' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ])
    ]);

    res.json({
      stats: {
        totalAppointments,
        todayAppointments,
        completedAppointments,
        pendingAppointments,
        totalEarnings: totalEarnings[0]?.total || 0,
        rating: doctor.rating
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
