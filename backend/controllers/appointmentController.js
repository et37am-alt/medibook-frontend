const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { sendEmail, bookingConfirmationEmail, cancellationEmail } = require('../utils/emailService');

// @route   POST /api/appointments
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, timeSlot, reason } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isAvailable) {
      return res.status(404).json({ success: false, message: 'Doctor not found or unavailable.' });
    }

    // Check for double booking
    const existing = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate,
      timeSlot,
      status: { $ne: 'cancelled' }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This time slot is already booked.' });
    }

    const appointment = await Appointment.create({
      user: req.user._id, doctor: doctorId, appointmentDate, timeSlot, reason
    });
    await appointment.populate(['user', 'doctor']);

    // Send booking confirmation email
    const apptDate = new Date(appointment.appointmentDate).toDateString();
    const { subject, html } = bookingConfirmationEmail(
      appointment.user.name,
      appointment.doctor.name,
      appointment.doctor.specialization,
      apptDate,
      appointment.timeSlot,
      appointment.doctor.fees
    );
    sendEmail({ to: appointment.user.email, subject, html });

    res.status(201).json({ success: true, message: 'Appointment booked successfully!', appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// @route   GET /api/appointments/my
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user._id })
      .populate('doctor', 'name specialization fees')
      .sort({ appointmentDate: -1 });
    res.json({ success: true, count: appointments.length, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// @route   PUT /api/appointments/:id/cancel
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    if (appointment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (appointment.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed appointment.' });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = req.body.reason || 'Cancelled by user';
    await appointment.save();
    await appointment.populate(['user', 'doctor']);

    // Send cancellation email
    const apptDate = new Date(appointment.appointmentDate).toDateString();
    const { subject, html } = cancellationEmail(
      appointment.user.name,
      appointment.doctor.name,
      apptDate,
      appointment.timeSlot,
      appointment.cancellationReason
    );
    sendEmail({ to: appointment.user.email, subject, html });

    res.json({ success: true, message: 'Appointment cancelled.', appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// @route   GET /api/appointments/slots/:doctorId?date=YYYY-MM-DD
exports.getBookedSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    const appointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: { $gte: start, $lt: end },
      status: { $ne: 'cancelled' }
    }).select('timeSlot');

    const bookedSlots = appointments.map(a => a.timeSlot);
    res.json({ success: true, bookedSlots });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};
