import mongoose from 'mongoose'

// Define schema
const DisabledDateSchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, 'Please provide a date'],
    unique: true
  },
  reason: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Use existing model or create new one
export default mongoose.models.DisabledDate || 
  mongoose.model('DisabledDate', DisabledDateSchema) 