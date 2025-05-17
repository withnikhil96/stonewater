import mongoose from 'mongoose'

// Define schema
const DisabledDateSchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, 'Please provide a date']
  },
  reason: {
    type: String,
    default: ''
  },
  lunchDisabled: {
    type: Boolean,
    default: true
  },
  dinnerDisabled: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Added compound index for unique constraints
DisabledDateSchema.index({ date: 1 }, { unique: true });

// Use existing model or create new one
export default mongoose.models.DisabledDate || 
  mongoose.model('DisabledDate', DisabledDateSchema) 