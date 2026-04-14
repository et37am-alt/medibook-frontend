import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const SPECIALIZATIONS = [
  'All','Cardiologist','Dermatologist','General Physician','Neurologist',
  'Orthopedic','Pediatrician','Psychiatrist','ENT','Gynecologist','Dentist',
];

import API from '../utils/config';

const DoctorCard = ({ doc }) => {
  const photoUrl = doc.photo
    ? `${API}/uploads/${doc.photo}`
    : null;

  return (
    <div style={styles.card}>
      {/* Photo */}
      <div style={styles.photoWrap}>
        {photoUrl ? (
          <img src={photoUrl} alt={doc.name} style={styles.photo} />
        ) : (
          <div style={styles.avatarFallback}>{doc.name.charAt(0)}</div>
        )}
      </div>

      {/* Info */}
      <div style={styles.cardBody}>
        <h3 style={styles.docName}>Dr. {doc.name}</h3>
        <span style={styles.specBadge}>{doc.specialization}</span>

        <div style={styles.statsRow}>
          <span>⭐ {doc.rating}</span>
          <span>🩺 {doc.experience} yrs</span>
          <span>💰 ₹{doc.fees}</span>
        </div>

        <p style={styles.bio}>{doc.bio || 'Experienced specialist providing quality care.'}</p>

        {/* Clinic & Location */}
        {(doc.clinicName || doc.clinicAddress) && (
          <div style={styles.locationBox}>
            {doc.clinicName && <div style={styles.clinicName}>🏥 {doc.clinicName}</div>}
            {doc.clinicAddress && (
              <div style={styles.address}>
                📍 {doc.clinicAddress}
                {doc.city ? `, ${doc.city}` : ''}
                {doc.state ? `, ${doc.state}` : ''}
                {doc.pincode ? ` - ${doc.pincode}` : ''}
              </div>
            )}
            {doc.mapLink && (
              <a href={doc.mapLink} target="_blank" rel="noreferrer" style={styles.mapLink}>
                🗺 View on Google Maps
              </a>
            )}
          </div>
        )}

        {/* Available days */}
        <div style={styles.daysRow}>
          {doc.availableDays?.map(d => (
            <span key={d} style={styles.dayBadge}>{d.slice(0,3)}</span>
          ))}
        </div>

        {doc.isAvailable ? (
          <Link to={`/book/${doc._id}`} style={styles.bookBtn}>Book Appointment</Link>
        ) : (
          <button style={styles.unavailBtn} disabled>Currently Unavailable</button>
        )}
      </div>
    </div>
  );
};

const Doctors = () => {
  const [doctors, setDoctors]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [cityFilter, setCityFilter]     = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const selected = searchParams.get('specialization') || 'All';

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selected !== 'All') params.append('specialization', selected);
        if (cityFilter) params.append('city', cityFilter);
        const { data } = await axios.get(`/api/doctors?${params.toString()}`);
        setDoctors(data.doctors);
      } catch {
        toast.error('Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [selected, cityFilter]);

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase()) ||
    d.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Find a Doctor</h1>
        <div style={styles.searchRow}>
          <input
            type="text" placeholder="🔍 Search name, specialization, city..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          <input
            type="text" placeholder="📍 Filter by city..."
            value={cityFilter} onChange={e => setCityFilter(e.target.value)}
            style={{ ...styles.searchInput, width: '180px' }}
          />
        </div>
      </div>

      {/* Specialization tabs */}
      <div style={styles.filterBar}>
        {SPECIALIZATIONS.map(s => (
          <button key={s}
            onClick={() => { setSearchParams(s !== 'All' ? { specialization: s } : {}); setSearch(''); }}
            style={{ ...styles.filterBtn, ...(selected === s || (s === 'All' && !searchParams.get('specialization')) ? styles.filterActive : {}) }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.center}>Loading doctors...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.center}>No doctors found. Try a different filter.</div>
      ) : (
        <>
          <p style={styles.resultCount}>{filtered.length} doctor{filtered.length !== 1 ? 's' : ''} found</p>
          <div style={styles.grid}>
            {filtered.map(doc => <DoctorCard key={doc._id} doc={doc} />)}
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  page: { padding: '40px', maxWidth: '1200px', margin: '0 auto' },
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '2rem', fontWeight: 800, color: '#222', marginBottom: '16px' },
  searchRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  searchInput: {
    padding: '10px 16px', borderRadius: '30px', border: '1.5px solid #ddd',
    fontSize: '0.95rem', width: '280px', outline: 'none',
  },
  filterBar: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' },
  filterBtn: {
    padding: '7px 16px', borderRadius: '20px', border: '1.5px solid #ddd',
    background: '#fff', cursor: 'pointer', fontSize: '0.85rem', color: '#555', fontWeight: 500,
  },
  filterActive: { background: '#1a73e8', color: '#fff', borderColor: '#1a73e8' },
  resultCount: { color: '#888', fontSize: '0.9rem', marginBottom: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },

  card: {
    background: '#fff', borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
  },
  photoWrap: { width: '100%', height: '200px', overflow: 'hidden', background: '#e8f0fe', flexShrink: 0 },
  photo: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarFallback: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '4rem', fontWeight: 700,
    color: '#1a73e8', background: '#e8f0fe',
  },
  cardBody: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  docName: { fontSize: '1.15rem', fontWeight: 800, color: '#222', margin: 0 },
  specBadge: {
    display: 'inline-block', background: '#e8f0fe', color: '#1a73e8',
    padding: '3px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
  },
  statsRow: { display: 'flex', gap: '16px', fontSize: '0.88rem', color: '#555' },
  bio: { fontSize: '0.85rem', color: '#777', lineHeight: 1.6, margin: 0 },

  locationBox: {
    background: '#f8f9ff', borderRadius: '10px', padding: '12px',
    border: '1px solid #e0e8ff', display: 'flex', flexDirection: 'column', gap: '5px',
  },
  clinicName: { fontSize: '0.88rem', fontWeight: 700, color: '#333' },
  address: { fontSize: '0.82rem', color: '#666', lineHeight: 1.5 },
  mapLink: {
    fontSize: '0.82rem', color: '#1a73e8', fontWeight: 600,
    textDecoration: 'none', marginTop: '2px',
  },

  daysRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  dayBadge: {
    background: '#e8f0fe', color: '#1565c0', padding: '3px 9px',
    borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
  },
  bookBtn: {
    display: 'block', padding: '12px', background: '#1a73e8', color: '#fff',
    borderRadius: '10px', textAlign: 'center', fontWeight: 700,
    textDecoration: 'none', fontSize: '0.95rem', marginTop: '4px',
  },
  unavailBtn: {
    padding: '12px', background: '#f0f0f0', color: '#aaa',
    borderRadius: '10px', border: 'none', fontSize: '0.95rem',
    cursor: 'not-allowed', width: '100%', marginTop: '4px',
  },
  center: { textAlign: 'center', padding: '60px', color: '#999', fontSize: '1.1rem' },
};

export default Doctors;
