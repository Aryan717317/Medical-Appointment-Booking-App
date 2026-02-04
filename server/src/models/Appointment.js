import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['in-person', 'video'],
    default: 'in-person'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  reason: {
    type: String,
    maxlength: 500
  },
  symptoms: [{
    type: String
  }],
  notes: {
    type: String,
    maxlength: 2000
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'held', 'captured', 'refunded', 'failed'],
      default: 'pending'
    },
    amount: Number,
    currency: { type: String, default: 'usd' },
    stripePaymentIntentId: String,
    paidAt: Date,
    refundedAt: Date
  },
  videoSession: {
    roomName: String,
    roomUrl: String,
    token: String,
    startedAt: Date,
    endedAt: Date,
    duration: Number
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  rating: {
    score: { type: Number, min: 1, max: 5 },
    review: String,
    createdAt: Date
  },
  cancelledBy: {
    type: String,
    enum: ['patient', 'doctor', 'admin', 'system']
  },
  cancellationReason: String,
  cancelledAt: Date,
  remindersSent: [{
    type: { type: String, enum: ['email', 'sms'] },
    sentAt: Date
  }]
}, {
  timestamps: true
});

// Indexes
appointmentSchema.index({ patient: 1, date: 1 });
appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ 'payment.stripePaymentIntentId': 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
