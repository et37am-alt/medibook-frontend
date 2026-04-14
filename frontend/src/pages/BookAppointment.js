import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import axios from 'axios';
import { toast } from 'react-toastify';

import API from '../utils/config';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate     = useNavigate();

  const [doctor, setDoctor]             = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookedSlots, setBookedSlots]   = useState([]);
  const [reason, setReason]             = useState('');
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    axios.get(`/api/doctors/${doctorId}`)
      .then(({ data }) => setDoctor(data.doctor))
      .catch(() => { toast.error('Doctor not found'); navigate('/doctors'); });
  }, [doctorId, navigate]);

  useEffect(() => {
    if (!selectedDate) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
    axios.get(`/api/appointments/slots/${doctorId}?date=${dateStr}`)
      .then(({ data }) => setBookedSlots(data.bookedSlots))
      .catch(() => {});
    setSelectedSlot('');
  }, [selectedDate, doctorId]);

  const isAvailableDay = (date) => {
    if (date < new Date().setHours(0,0,0,0)) return false;
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return doctor?.availableDays?.includes(dayName);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot || !reason.trim()) {
      return toast.error('Please fill in all fields');
    }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/appointments', {
        doctorId,
        appointmentDate: selectedDate.toISOString(),
        timeSlot: selectedSlot,
        reason,
      });
      toast.success(data.message || 'Appointment booked!');
      navigate('/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!doctor) return <div style={styles.center}>Loading doctor details...</div>;

  const photoUrl = doctor.photo ? `${API}/uploads/${doctor.photo}` : null;
  const canBook  = selectedDate && selectedSlot && reason.trim().length > 0;

  return (
    <div style={styles.page}>

      {/* Doctor Info Card */}
      <div style={styles.docCard}>
        {/* Photo */}
        <div style={styles.photoWrap}>
          {photoUrl ? (
            <img src={photoUrl} alt={doctor.name} style={styles.photo} />
          ) : (
            <div style={styles.avatarFallback}>{doctor.name.charAt(0)}</div>
          )}
        </div>

        {/* Details */}
        <div style={{ flex: 1 }}>
          <h2 style={styles.docName}>Dr. {doctor.name}</h2>
          <span style={styles.specBadge}>{doctor.specialization}</span>
          <div style={styles.docMeta}>
            <span>⭐ {doctor.rating} Rating</span>
            <span>🩺 {doctor.experience} yrs exp</span>
            <span>💰 ₹{doctor.fees} fees</span>
          </div>
          {doctor.bio && <p style={styles.bio}>{doctor.bio}</p>}

          {/* Clinic Location */}
          {(doctor.clinicName || doctor.clinicAddress) && (
            <div style={styles.locationBox}>
              <div style={styles.locationTitle}>📍 Clinic Location</div>
              {doctor.clinicName    && <div style={styles.clinicName}>🏥 {doctor.clinicName}</div>}
              {doctor.clinicAddress && (
                <div style={styles.address}>
                  {doctor.clinicAddress}
                  {doctor.city    ? `, ${doctor.city}`    : ''}
                  {doctor.state   ? `, ${doctor.state}`   : ''}
                  {doctor.pincode ? ` - ${doctor.pincode}` : ''}
                </div>
              )}
              {doctor.mapLink && (
                <a href={doctor.mapLink} target="_blank" rel="noreferrer" style={styles.mapLink}>
                  🗺 View on Google Maps →
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking Form */}
      <div style={styles.formGrid}>

        {/* Date picker */}
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>📅 Select Appointment Date</h3>
          <DatePicker
            selected={selectedDate}
            onChange={setSelectedDate}
            minDate={new Date()}
            filterDate={isAvailableDay}
            inline
          />
          <div style={styles.availInfo}>
            <strong>Available days:</strong><br />
            {doctor.availableDays?.join(' · ')}
          </div>
        </div>

        {/* Time slot + Reason */}
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>🕐 Select Time Slot</h3>

          {!selectedDate ? (
            <div style={styles.hintBox}>Please select a date first to see available slots</div>
          ) : (
            <div style={styles.slotsGrid}>
              {doctor.availableSlots?.map(slot => {
                const booked = bookedSlots.includes(slot);
                const active = selectedSlot === slot;
                return (
                  <button key={slot} onClick={() => !booked && setSelectedSlot(slot)}
                    disabled={booked}
                    style={{
                      ...styles.slot,
                      ...(active ? styles.slotActive : {}),
                      ...(booked ? styles.slotBooked : {}),
                    }}>
                    {slot}
                    {booked && <div style={{ fontSize: '0.65rem', color: '#e53935' }}>Booked</div>}
                  </button>
                );
              })}
            </div>
          )}

          <h3 style={{ ...styles.panelTitle, marginTop: '24px' }}>📝 Reason for Visit</h3>
          <textarea
            value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Describe your symptoms or reason for visiting..."
            style={styles.textarea} rows={4} maxLength={300}
          />
          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#aaa', marginTop: '4px' }}>
            {reason.length}/300
          </div>

          {canBook && (
            <div style={styles.summary}>
              <h4 style={{ color: '#1a73e8', marginBottom: '10px' }}>📋 Booking Summary</h4>
              <div style={styles.summaryRow}><span>Doctor</span><strong>Dr. {doctor.name}</strong></div>
              <div style={styles.summaryRow}><span>Date</span><strong>{selectedDate.toDateString()}</strong></div>
              <div style={styles.summaryRow}><span>Time</span><strong>{selectedSlot}</strong></div>
              {doctor.clinicName && <div style={styles.summaryRow}><span>Clinic</span><strong>{doctor.clinicName}</strong></div>}
              <div style={styles.summaryRow}><span>Fees</span><strong>₹{doctor.fees}</strong></div>
            </div>
          )}

          <button
            onClick={handleBooking} disabled={loading || !canBook}
            style={{ ...styles.bookBtn, opacity: canBook ? 1 : 0.5, cursor: canBook ? 'pointer' : 'not-allowed' }}>
            {loading ? 'Booking...' : '✅ Confirm Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page:   { padding: '40px', maxWidth: '1050px', margin: '0 auto' },
  center: { textAlign: 'center', padding: '80px', color: '#888' },

  docCard: {
    display: 'flex', gap: '24px', background: '#fff', borderRadius: '20px',
    padding: '0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    marginBottom: '32px', overflow: 'hidden', flexWrap: 'wrap',
  },
  photoWrap: { width: '220px', minHeight: '200px', flexShrink: 0, background: '#e8f0fe' },
  photo:     { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  avatarFallback: {
    width: '100%', height: '100%', minHeight: '200px', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '4rem', fontWeight: 700, color: '#1a73e8',
  },

  docName:   { fontSize: '1.6rem', fontWeight: 800, color: '#222', margin: '24px 24px 6px 0' },
  specBadge: {
    display: 'inline-block', background: '#e8f0fe', color: '#1a73e8',
    padding: '4px 14px', borderRadius: '14px', fontSize: '0.82rem', fontWeight: 700,
  },
  docMeta: { display: 'flex', gap: '20px', fontSize: '0.9rem', color: '#555', margin: '10px 0' },
  bio:     { fontSize: '0.88rem', color: '#777', lineHeight: 1.6, marginBottom: '12px' },

  locationBox: {
    background: '#f0f4ff', borderRadius: '12px', padding: '14px',
    border: '1px solid #d0e0ff', margin: '0 24px 24px 0', display: 'flex', flexDirection: 'column', gap: '5px',
  },
  locationTitle: { fontSize: '0.85rem', fontWeight: 700, color: '#1a73e8', marginBottom: '4px' },
  clinicName:    { fontSize: '0.9rem', fontWeight: 700, color: '#333' },
  address:       { fontSize: '0.83rem', color: '#666', lineHeight: 1.5 },
  mapLink: {
    fontSize: '0.83rem', color: '#1a73e8', fontWeight: 600,
    textDecoration: 'none', marginTop: '4px',
  },

  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' },
  panel: { background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' },
  panelTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#333', marginTop: 0, marginBottom: '16px' },
  availInfo: { marginTop: '16px', padding: '12px', background: '#f0f4ff', borderRadius: '10px', fontSize: '0.85rem', color: '#555', lineHeight: 1.8 },
  hintBox: { background: '#f8f9ff', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#888', fontSize: '0.9rem' },
  slotsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' },
  slot: { padding: '10px 8px', border: '1.5px solid #ddd', borderRadius: '10px', background: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#333', textAlign: 'center' },
  slotActive: { background: '#1a73e8', color: '#fff', borderColor: '#1a73e8' },
  slotBooked: { background: '#f5f5f5', color: '#ccc', cursor: 'not-allowed', borderColor: '#eee' },
  textarea: { width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #ddd', fontSize: '0.95rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 },
  summary: { background: '#f0f4ff', borderRadius: '12px', padding: '16px', margin: '16px 0', border: '1px solid #d0e0ff' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555', padding: '5px 0', borderBottom: '1px solid #dde8ff' },
  bookBtn: { width: '100%', padding: '14px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', marginTop: '12px' },
};

export default BookAppointment;
