const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    enum: [
      'Cardiologist', 'Dermatologist', 'General Physician', 'Neurologist',
      'Orthopedic', 'Pediatrician', 'Psychiatrist', 'ENT', 'Gynecologist', 'Dentist'
    ]
  },
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  fees: {
    type: Number,
    required: [true, 'Consultation fees are required'],
    min: 0
  },
  rating: {
    type: Number,
    default: 4.0,
    min: 1,
    max: 5
  },
  availableDays: {
    type: [String],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  availableSlots: {
    type: [String],
    default: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM']
  },
  bio: {
    type: String,
    maxlength: 500
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
