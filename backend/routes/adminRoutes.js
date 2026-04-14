const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendEmail, statusUpdateEmail } = require('../utils/emailService');

// GET all appointments (admin)
router.get('/appointments', protect, adminOnly, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('user', 'name email phone')
      .populate('doctor', 'name specialization fees')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: appointments.length, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update appointment status (admin)
router.put('/appointments/:id', protect, adminOnly, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate(['user', 'doctor']);

    if (!appointment) return res.status(404).json({ success: false, message: 'Not found.' });

    // Send status update email to patient
    const apptDate = new Date(appointment.appointmentDate).toDateString();
    const { subject, html } = statusUpdateEmail(
      appointment.user.name,
      appointment.doctor.name,
      apptDate,
      appointment.timeSlot,
      req.body.status
    );
    sendEmail({ to: appointment.user.email, subject, html });

    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET dashboard stats (admin)
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalUsers        = await User.countDocuments({ role: 'user' });
    const totalAppointments = await Appointment.countDocuments();
    const pending           = await Appointment.countDocuments({ status: 'pending' });
    const confirmed         = await Appointment.countDocuments({ status: 'confirmed' });
    const cancelled         = await Appointment.countDocuments({ status: 'cancelled' });
    const completed         = await Appointment.countDocuments({ status: 'completed' });

    res.json({ success: true, stats: { totalUsers, totalAppointments, pending, confirmed, cancelled, completed } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
