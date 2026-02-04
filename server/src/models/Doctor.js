import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number
  }],
  experience: {
    type: Number,
    default: 0
  },
  consultationFee: {
    type: Number,
    required: true
  },
  videoConsultationFee: {
    type: Number
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  languages: [{
    type: String
  }],
  availability: {
    monday: { start: String, end: String, isAvailable: { type: Boolean, default: true } },
    tuesday: { start: String, end: String, isAvailable: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, isAvailable: { type: Boolean, default: true } },
    thursday: { start: String, end: String, isAvailable: { type: Boolean, default: true } },
    friday: { start: String, end: String, isAvailable: { type: Boolean, default: true } },
    saturday: { start: String, end: String, isAvailable: { type: Boolean, default: false } },
    sunday: { start: String, end: String, isAvailable: { type: Boolean, default: false } }
  },
  slotDuration: {
    type: Number,
    default: 30
  },
  isAcceptingAppointments: {
    type: Boolean,
    default: true
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  maxPatientsPerSlot: {
    type: Number,
    default: 1
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for search
doctorSchema.index({ specialization: 'text', 'qualifications.degree': 'text' });

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
