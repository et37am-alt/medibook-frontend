const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  getBookedSlots,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',                  protect, bookAppointment);
router.get('/my',                 protect, getMyAppointments);
router.put('/:id/cancel',         protect, cancelAppointment);
router.get('/slots/:doctorId',    getBookedSlots);

module.exports = router;
