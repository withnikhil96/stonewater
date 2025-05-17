import clientPromise from './mongodb'

// Collection name for disabled dates
const COLLECTION_NAME = 'disabledDates'

// Get MongoDB collection
export async function getDisabledDatesCollection() {
  const client = await clientPromise
  // Ensure client is connected
  try {
    await client.connect()
  } catch (error) {
    // Already connected or other error
    console.log("Connection status:", client.topology?.isConnected?.() || "Unknown")
  }
  const db = client.db(process.env.MONGODB_DB || 'stonewater')
  return db.collection(COLLECTION_NAME)
}

// Get all disabled dates
export async function getAllDisabledDates() {
  try {
    const collection = await getDisabledDatesCollection()
    const dates = await collection.find({}).toArray()
    return dates
  } catch (error) {
    console.error('Error fetching disabled dates:', error)
    return []
  }
}

// Check if a specific date is disabled
export async function isDateDisabled(dateStr: string, timeSlot?: 'lunch' | 'dinner') {
  try {
    const collection = await getDisabledDatesCollection()
    const record = await collection.findOne({ date: dateStr })
    
    if (!record) return false
    
    // If no time slot specified, return true if the date is disabled (either meal)
    if (!timeSlot) {
      return record.lunchDisabled || record.dinnerDisabled
    }
    
    // Check specific time slot
    return timeSlot === 'lunch' ? record.lunchDisabled : record.dinnerDisabled
  } catch (error) {
    console.error('Error checking if date is disabled:', error)
    return false
  }
}

// Disable a date
export async function disableDate(date: string, reason: string = '', options: { lunchDisabled?: boolean, dinnerDisabled?: boolean } = {}) {
  try {
    const collection = await getDisabledDatesCollection()
    
    // Set default values if not provided
    const lunchDisabled = options.lunchDisabled !== undefined ? options.lunchDisabled : true
    const dinnerDisabled = options.dinnerDisabled !== undefined ? options.dinnerDisabled : true
    
    // Check if date already exists
    const existing = await collection.findOne({ date })
    if (existing) {
      // Update existing record
      await collection.updateOne(
        { date },
        { 
          $set: { 
            reason, 
            lunchDisabled,
            dinnerDisabled,
            updatedAt: new Date() 
          } 
        }
      )
    } else {
      // Insert new disabled date
      await collection.insertOne({
        date,
        reason,
        lunchDisabled,
        dinnerDisabled,
        createdAt: new Date()
      })
    }
    
    return true
  } catch (error) {
    console.error('Error disabling date:', error)
    return false
  }
}

// Update time slot availability
export async function updateTimeSlot(date: string, timeSlot: 'lunch' | 'dinner', disabled: boolean) {
  try {
    const collection = await getDisabledDatesCollection()
    const field = timeSlot === 'lunch' ? 'lunchDisabled' : 'dinnerDisabled'
    
    // Check if date exists
    const existing = await collection.findOne({ date })
    if (existing) {
      // Update specific time slot
      await collection.updateOne(
        { date },
        { $set: { [field]: disabled, updatedAt: new Date() } }
      )
      
      // If both slots are enabled, remove the record
      if (timeSlot === 'lunch' && !disabled && !existing.dinnerDisabled) {
        await collection.deleteOne({ date })
      } else if (timeSlot === 'dinner' && !disabled && !existing.lunchDisabled) {
        await collection.deleteOne({ date })
      }
      
      return true
    } else if (disabled) {
      // Create new record if disabling a slot for a new date
      const newRecord = {
        date,
        reason: '',
        lunchDisabled: timeSlot === 'lunch',
        dinnerDisabled: timeSlot === 'dinner',
        createdAt: new Date()
      }
      
      await collection.insertOne(newRecord)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error updating time slot:', error)
    return false
  }
}

// Enable a date (remove from disabled dates)
export async function enableDate(date: string) {
  try {
    const collection = await getDisabledDatesCollection()
    const result = await collection.deleteOne({ date })
    return result.deletedCount > 0
  } catch (error) {
    console.error('Error enabling date:', error)
    return false
  }
} 