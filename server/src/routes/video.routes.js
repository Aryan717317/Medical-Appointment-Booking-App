import express from 'express';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import { authenticate } from '../middleware/auth.js';
import { createVideoRoom, getVideoToken, endVideoRoom } from '../services/video.service.js';

const router = express.Router();

// Create/get video room for appointment
router.post('/room/:appointmentId', authenticate, async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate({
        path: 'doctor',
        populate: { path: 'user' }
      })
      .populate('patient');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.type !== 'video') {
      return res.status(400).json({ message: 'Not a video appointment' });
    }

    // Check authorization
    const doctor = await Doctor.findOne({ user: req.user._id });
    const isPatient = appointment.patient._id.toString() === req.user._id.toString();
    const isDoctor = doctor && appointment.doctor._id.toString() === doctor._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check time window (allow 10 min before to 30 min after scheduled time)
    const appointmentTime = new Date(appointment.date);
    const [hours, minutes] = appointment.startTime.split(':');
    appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const now = new Date();
    const windowStart = new Date(appointmentTime.getTime() - 10 * 60 * 1000);
    const windowEnd = new Date(appointmentTime.getTime() + 30 * 60 * 1000);

    if (now < windowStart || now > windowEnd) {
      return res.status(400).json({ 
        message: 'Video call only available 10 min before to 30 min after appointment time' 
      });
    }

    // Create room if doesn't exist
    if (!appointment.videoSession.roomName) {
      const roomName = `medbook-${appointment._id}`;
      const room = await createVideoRoom(roomName);
      
      appointment.videoSession.roomName = room.name;
      appointment.videoSession.roomUrl = room.url;
      await appointment.save();
    }

    // Generate token for user
    const isOwner = isDoctor;
    const userName = isDoctor 
      ? `Dr. ${req.user.lastName}`
      : `${req.user.firstName} ${req.user.lastName}`;

    const token = await getVideoToken(
      appointment.videoSession.roomName,
      req.user._id.toString(),
      userName,
      isOwner
    );

    res.json({
      roomUrl: appointment.videoSession.roomUrl,
      token,
      roomName: appointment.videoSession.roomName
    });
  } catch (error) {
    next(error);
  }
});

// Start video session
router.post('/start/:appointmentId', authenticate, async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Only doctors can start sessions' });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.appointmentId,
      doctor: doctor._id
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.status = 'in-progress';
    appointment.videoSession.startedAt = new Date();
    await appointment.save();

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
});

// End video session
router.post('/end/:appointmentId', authenticate, async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Only doctors can end sessions' });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.appointmentId,
      doctor: doctor._id
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // End Daily.co room
    if (appointment.videoSession.roomName) {
      await endVideoRoom(appointment.videoSession.roomName);
    }

    appointment.videoSession.endedAt = new Date();
    if (appointment.videoSession.startedAt) {
      appointment.videoSession.duration = Math.round(
        (appointment.videoSession.endedAt - appointment.videoSession.startedAt) / 1000
      );
    }
    await appointment.save();

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
});

export default router;
