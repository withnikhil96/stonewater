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
export async function isDateDisabled(dateStr: string) {
  try {
    const collection = await getDisabledDatesCollection()
    const count = await collection.countDocuments({ date: dateStr })
    return count > 0
  } catch (error) {
    console.error('Error checking if date is disabled:', error)
    return false
  }
}

// Disable a date
export async function disableDate(date: string, reason: string = '') {
  try {
    const collection = await getDisabledDatesCollection()
    
    // Check if date already exists
    const existing = await collection.findOne({ date })
    if (existing) {
      // Update reason if date already exists
      await collection.updateOne(
        { date },
        { $set: { reason, updatedAt: new Date() } }
      )
    } else {
      // Insert new disabled date
      await collection.insertOne({
        date,
        reason,
        createdAt: new Date()
      })
    }
    
    return true
  } catch (error) {
    console.error('Error disabling date:', error)
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