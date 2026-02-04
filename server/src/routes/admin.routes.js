import express from 'express';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Department from '../models/Department.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin
router.use(authenticate, authorize('admin'));

// Dashboard stats
router.get('/stats', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      monthlyAppointments,
      lastMonthAppointments,
      completedAppointments,
      cancelledAppointments,
      totalRevenue,
      monthlyRevenue
    ] = await Promise.all([
      User.countDocuments(),
      Doctor.countDocuments(),
      Patient.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ 
        date: { $gte: today, $lt: new Date(today.getTime() + 86400000) }
      }),
      Appointment.countDocuments({ date: { $gte: thisMonth } }),
      Appointment.countDocuments({ 
        date: { $gte: lastMonth, $lt: thisMonth }
      }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.aggregate([
        { $match: { 'payment.status': 'captured' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ]),
      Appointment.aggregate([
        { $match: { 'payment.status': 'captured', date: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ])
    ]);

    res.json({
      stats: {
        users: {
          total: totalUsers,
          doctors: totalDoctors,
          patients: totalPatients
        },
        appointments: {
          total: totalAppointments,
          today: todayAppointments,
          thisMonth: monthlyAppointments,
          lastMonth: lastMonthAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          growth: lastMonthAppointments > 0 
            ? ((monthlyAppointments - lastMonthAppointments) / lastMonthAppointments * 100).toFixed(1)
            : 0
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          thisMonth: monthlyRevenue[0]?.total || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all users
router.get('/users', async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    res.json({
      users,
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

// Update user status
router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Create doctor account
router.post('/doctors', async (req, res, next) => {
  try {
    const { 
      email, password, firstName, lastName, phone,
      specialization, department, consultationFee,
      videoConsultationFee, experience, bio, qualifications
    } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: 'doctor',
      isVerified: true
    });
    await user.save();

    // Create doctor profile
    const doctor = new Doctor({
      user: user._id,
      specialization,
      department,
      consultationFee,
      videoConsultationFee,
      experience,
      bio,
      qualifications,
      isVerified: true
    });
    await doctor.save();

    res.status(201).json({ user, doctor });
  } catch (error) {
    next(error);
  }
});

// Get all doctors
router.get('/doctors', async (req, res, next) => {
  try {
    const { department, verified, page = 1, limit = 20 } = req.query;

    const query = {};
    if (department) query.department = department;
    if (verified !== undefined) query.isVerified = verified === 'true';

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .populate('user', 'firstName lastName email phone isActive')
        .populate('department', 'name')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
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

// Verify doctor
router.patch('/doctors/:id/verify', async (req, res, next) => {
  try {
    const { isVerified } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isVerified },
      { new: true }
    ).populate('user', 'firstName lastName email');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json({ doctor });
  } catch (error) {
    next(error);
  }
});

// Get all appointments
router.get('/appointments', async (req, res, next) => {
  try {
    const { status, date, doctorId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (doctorId) query.doctor = doctorId;
    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: queryDate, $lt: nextDay };
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('patient', 'firstName lastName email')
        .populate({
          path: 'doctor',
          populate: { path: 'user', select: 'firstName lastName' }
        })
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

// Get reports
router.get('/reports', async (req, res, next) => {
  try {
    const { startDate, endDate, type = 'appointments' } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let report;

    switch (type) {
      case 'appointments':
        report = await Appointment.aggregate([
          { $match: { date: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              total: { $sum: 1 },
              completed: { 
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              cancelled: {
                $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
              }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        break;

      case 'revenue':
        report = await Appointment.aggregate([
          { 
            $match: { 
              date: { $gte: start, $lte: end },
              'payment.status': 'captured'
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              total: { $sum: '$payment.amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        break;

      case 'doctors':
        report = await Appointment.aggregate([
          { $match: { date: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: '$doctor',
              appointments: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              revenue: {
                $sum: { 
                  $cond: [
                    { $eq: ['$payment.status', 'captured'] }, 
                    '$payment.amount', 
                    0
                  ]
                }
              }
            }
          },
          {
            $lookup: {
              from: 'doctors',
              localField: '_id',
              foreignField: '_id',
              as: 'doctor'
            }
          },
          { $unwind: '$doctor' },
          {
            $lookup: {
              from: 'users',
              localField: 'doctor.user',
              foreignField: '_id',
              as: 'user'
            }
          },
          { $unwind: '$user' },
          {
            $project: {
              doctorName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
              appointments: 1,
              completed: 1,
              revenue: 1
            }
          },
          { $sort: { appointments: -1 } }
        ]);
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json({ report, startDate: start, endDate: end, type });
  } catch (error) {
    next(error);
  }
});

export default router;
