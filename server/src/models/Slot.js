import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
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
  isAvailable: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedReason: String,
  maxPatients: {
    type: Number,
    default: 1
  },
  bookedCount: {
    type: Number,
    default: 0
  },
  lock: {
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lockedAt: Date,
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 }
    }
  }
}, {
  timestamps: true
});

// Compound index for unique slot per doctor per datetime
slotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });

// TTL index for lock expiration (5 minutes)
slotSchema.index({ 'lock.expiresAt': 1 }, { expireAfterSeconds: 0 });

// Virtual to check if slot is bookable
slotSchema.virtual('isBookable').get(function() {
  return this.isAvailable && 
         !this.isBlocked && 
         this.bookedCount < this.maxPatients &&
         (!this.lock.lockedBy || this.lock.expiresAt < new Date());
});

const Slot = mongoose.model('Slot', slotSchema);
export default Slot;
