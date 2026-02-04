import express from 'express';
import Slot from '../models/Slot.js';
import Doctor from '../models/Doctor.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createSlotValidation } from '../middleware/validation.js';

const router = express.Router();

// Get available slots for a doctor
router.get('/doctor/:doctorId', async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date, startDate, endDate } = req.query;

    const query = { 
      doctor: doctorId,
      isAvailable: true,
      isBlocked: false
    };

    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: queryDate, $lt: nextDay };
    } else if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    } else {
      // Default to next 7 days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      query.date = { $gte: today, $lte: nextWeek };
    }

    const slots = await Slot.find(query)
      .sort({ date: 1, startTime: 1 });

    // Filter out locked slots (unless lock expired)
    const availableSlots = slots.filter(slot => {
      if (!slot.lock.lockedBy) return true;
      return slot.lock.expiresAt < new Date();
    });

    res.json({ slots: availableSlots });
  } catch (error) {
    next(error);
  }
});

// Create slots (doctor only)
router.post('/', authenticate, authorize('doctor'), createSlotValidation, async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const { date, startTime, endTime, maxPatients = 1 } = req.body;

    // Check for existing slot
    const existingSlot = await Slot.findOne({
      doctor: doctor._id,
      date: new Date(date),
      startTime
    });

    if (existingSlot) {
      return res.status(400).json({ message: 'Slot already exists' });
    }

    const slot = new Slot({
      doctor: doctor._id,
      date: new Date(date),
      startTime,
      endTime,
      maxPatients
    });

    await slot.save();

    res.status(201).json({ slot });
  } catch (error) {
    next(error);
  }
});

// Bulk create slots (doctor only)
router.post('/bulk', authenticate, authorize('doctor'), async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const { startDate, endDate, slots: slotTimes } = req.body;

    if (!startDate || !endDate || !slotTimes || !slotTimes.length) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const createdSlots = [];

    // Generate slots for each day
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][d.getDay()];
      
      // Check if doctor works on this day
      if (!doctor.availability[dayOfWeek]?.isAvailable) continue;

      for (const slotTime of slotTimes) {
        try {
          const slot = new Slot({
            doctor: doctor._id,
            date: new Date(d),
            startTime: slotTime.startTime,
            endTime: slotTime.endTime,
            maxPatients: slotTime.maxPatients || 1
          });
          await slot.save();
          createdSlots.push(slot);
        } catch (err) {
          // Skip duplicate slots
          if (err.code !== 11000) throw err;
        }
      }
    }

    res.status(201).json({ 
      message: `Created ${createdSlots.length} slots`,
      slots: createdSlots 
    });
  } catch (error) {
    next(error);
  }
});

// Get doctor's slots (doctor only)
router.get('/my', authenticate, authorize('doctor'), async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const { date, startDate, endDate, showAll } = req.query;

    const query = { doctor: doctor._id };

    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: queryDate, $lt: nextDay };
    } else if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    if (showAll !== 'true') {
      query.isBlocked = false;
    }

    const slots = await Slot.find(query).sort({ date: 1, startTime: 1 });

    res.json({ slots });
  } catch (error) {
    next(error);
  }
});

// Block/unblock slot (doctor only)
router.patch('/:id/block', authenticate, authorize('doctor'), async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const { blocked, reason } = req.body;

    const slot = await Slot.findOneAndUpdate(
      { _id: req.params.id, doctor: doctor._id },
      { 
        isBlocked: blocked,
        blockedReason: blocked ? reason : null
      },
      { new: true }
    );

    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    res.json({ slot });
  } catch (error) {
    next(error);
  }
});

// Delete slot (doctor only)
router.delete('/:id', authenticate, authorize('doctor'), async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const slot = await Slot.findOne({ 
      _id: req.params.id, 
      doctor: doctor._id 
    });

    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    if (slot.bookedCount > 0) {
      return res.status(400).json({ message: 'Cannot delete slot with bookings' });
    }

    await slot.deleteOne();

    res.json({ message: 'Slot deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
