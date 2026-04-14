// Seed sample doctors + admin user
// Run once: node seed.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Doctor = require('./models/Doctor');
const User   = require('./models/User');

const doctors = [
  {
    name: 'Arjun Sharma', specialization: 'Cardiologist', experience: 12, fees: 800,
    rating: 4.8, availableDays: ['Monday', 'Wednesday', 'Friday'],
    availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
    bio: 'Expert in heart diseases and cardiac care with 12 years of experience.', isAvailable: true
  },
  {
    name: 'Priya Reddy', specialization: 'Dermatologist', experience: 8, fees: 600,
    rating: 4.7, availableDays: ['Tuesday', 'Thursday', 'Saturday'],
    availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
    bio: 'Specialized in skin disorders, cosmetic procedures, and hair treatments.', isAvailable: true
  },
  {
    name: 'Ramesh Iyer', specialization: 'General Physician', experience: 15, fees: 400,
    rating: 4.9, availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'],
    bio: 'General medicine expert — first point of contact for all health concerns.', isAvailable: true
  },
  {
    name: 'Sunita Patel', specialization: 'Pediatrician', experience: 10, fees: 500,
    rating: 4.6, availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
    availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'],
    bio: 'Dedicated to the health and wellness of children from birth to adolescence.', isAvailable: true
  },
  {
    name: 'Vikram Nair', specialization: 'Orthopedic', experience: 14, fees: 900,
    rating: 4.5, availableDays: ['Tuesday', 'Thursday', 'Saturday'],
    availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
    bio: 'Specialist in bone, joint, and muscle injuries. Sports medicine expert.', isAvailable: true
  },
  {
    name: 'Meena Krishnan', specialization: 'Neurologist', experience: 11, fees: 1000,
    rating: 4.7, availableDays: ['Monday', 'Wednesday', 'Friday'],
    availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'],
    bio: 'Expert in brain and nervous system disorders, stroke, and epilepsy.', isAvailable: true
  },
  {
    name: 'Kavita Menon', specialization: 'Gynecologist', experience: 9, fees: 700,
    rating: 4.8, availableDays: ['Monday', 'Tuesday', 'Thursday', 'Saturday'],
    availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
    bio: "Specialist in women's health, pregnancy care, and reproductive health.", isAvailable: true
  },
  {
    name: 'Suresh Kumar', specialization: 'Dentist', experience: 7, fees: 350,
    rating: 4.4, availableDays: ['Tuesday', 'Wednesday', 'Friday', 'Saturday'],
    availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'],
    bio: 'Dental surgeon specializing in cosmetic dentistry, implants, and orthodontics.', isAvailable: true
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Doctor.deleteMany({});
    await Doctor.insertMany(doctors);
    console.log(`✅ ${doctors.length} doctors seeded`);

    // Create admin user if not exists
    const existingAdmin = await User.findOne({ email: 'admin@medibook.com' });
    if (!existingAdmin) {
      await User.create({
        name: 'Admin User',
        email: 'admin@medibook.com',
        password: 'admin123',
        phone: '9999999999',
        role: 'admin',
      });
      console.log('✅ Admin created → Email: admin@medibook.com | Password: admin123');
    } else {
      console.log('ℹ️  Admin already exists');
    }

    console.log('✅ Seeding complete!');
    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
};

seedDB();
