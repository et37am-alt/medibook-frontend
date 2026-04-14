import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

import API from '../utils/config';

const BADGE = {
  pending:   { bg: '#fff8e1', color: '#f57f17' },
  confirmed: { bg: '#e8f5e9', color: '#2e7d32' },
  completed: { bg: '#e3f2fd', color: '#1565c0' },
  cancelled: { bg: '#ffebee', color: '#c62828' },
};

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const SLOTS = ['09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM'];
const SPECS = ['Cardiologist','Dermatologist','General Physician','Neurologist','Orthopedic','Pediatrician','Psychiatrist','ENT','Gynecologist','Dentist'];

const emptyDoctor = {
  name:'', specialization:'General Physician', experience:'', fees:'', bio:'',
  availableDays:[], availableSlots:[],
  clinicName:'', clinicAddress:'', city:'', state:'', pincode:'', mapLink:'',
};

const AdminDashboard = () => {
  const [stats, setStats]               = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors]           = useState([]);
  const [tab, setTab]                   = useState('stats');
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [showForm, setShowForm]         = useState(false);
  const [editDoctor, setEditDoctor]     = useState(null);
  const [form, setForm]                 = useState(emptyDoctor);
  const [photoFile, setPhotoFile]       = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving]             = useState(false);

  const fetchAll = async () => {
    try {
      const [s, a, d] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/appointments'),
        axios.get('/api/doctors'),
      ]);
      setStats(s.data.stats);
      setAppointments(a.data.appointments);
      setDoctors(d.data.doctors);
    } catch { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/admin/appointments/${id}`, { status });
      toast.success(`Status → "${status}"`);
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a));
    } catch { toast.error('Update failed'); }
  };

  const openAddForm = () => {
    setEditDoctor(null);
    setForm(emptyDoctor);
    setPhotoFile(null);
    setPhotoPreview('');
    setShowForm(true);
  };

  const openEditForm = (doc) => {
    setEditDoctor(doc);
    setForm({
      name: doc.name, specialization: doc.specialization,
      experience: doc.experience, fees: doc.fees, bio: doc.bio || '',
      availableDays: doc.availableDays || [], availableSlots: doc.availableSlots || [],
      clinicName: doc.clinicName || '', clinicAddress: doc.clinicAddress || '',
      city: doc.city || '', state: doc.state || '', pincode: doc.pincode || '',
      mapLink: doc.mapLink || '',
    });
    setPhotoFile(null);
    setPhotoPreview(doc.photo ? `${API}/uploads/${doc.photo}` : '');
    setShowForm(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const toggleDay  = (d) => setForm(f => ({ ...f, availableDays:  f.availableDays.includes(d)  ? f.availableDays.filter(x=>x!==d)  : [...f.availableDays, d]  }));
  const toggleSlot = (s) => setForm(f => ({ ...f, availableSlots: f.availableSlots.includes(s) ? f.availableSlots.filter(x=>x!==s) : [...f.availableSlots, s] }));

  const handleSave = async () => {
    if (!form.name || !form.specialization || !form.fees || !form.experience) {
      return toast.error('Please fill in all required fields');
    }
    if (form.availableDays.length === 0) return toast.error('Select at least one available day');
    if (form.availableSlots.length === 0) return toast.error('Select at least one time slot');

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (Array.isArray(v)) fd.append(k, JSON.stringify(v));
        else fd.append(k, v);
      });
      if (photoFile) fd.append('photo', photoFile);

      if (editDoctor) {
        await axios.put(`/api/doctors/${editDoctor._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Doctor updated!');
      } else {
        await axios.post('/api/doctors', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Doctor added!');
      }
      setShowForm(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this doctor?')) return;
    try {
      await axios.delete(`/api/doctors/${id}`);
      toast.success('Doctor deleted');
      fetchAll();
    } catch { toast.error('Delete failed'); }
  };

  if (loading) return <div style={styles.center}>Loading admin dashboard...</div>;

  const filteredAppts = appointments.filter(a =>
    a.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.status?.includes(searchTerm.toLowerCase())
  );

  const statCards = [
    { label:'Total Users',        value:stats?.totalUsers,        color:'#1a73e8', icon:'👥' },
    { label:'Total Appointments', value:stats?.totalAppointments, color:'#7c4dff', icon:'📅' },
    { label:'Pending',            value:stats?.pending,           color:'#f57c00', icon:'⏳' },
    { label:'Confirmed',          value:stats?.confirmed,         color:'#2e7d32', icon:'✅' },
    { label:'Completed',          value:stats?.completed,         color:'#0288d1', icon:'✔' },
    { label:'Cancelled',          value:stats?.cancelled,         color:'#c62828', icon:'❌' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>🛠 Admin Dashboard</h1>
        <span style={styles.roleBadge}>Admin</span>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {['stats','appointments','doctors'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ ...styles.tab, ...(tab===t ? styles.tabActive : {}) }}>
            {t==='stats' ? '📊 Statistics' : t==='appointments' ? '📋 Appointments' : '👨‍⚕️ Doctors'}
          </button>
        ))}
      </div>

      {/* ── Stats ── */}
      {tab === 'stats' && (
        <div style={styles.statsGrid}>
          {statCards.map((c,i) => (
            <div key={i} style={{ ...styles.statCard, borderTop: `4px solid ${c.color}` }}>
              <div style={styles.statIcon}>{c.icon}</div>
              <div style={{ ...styles.statValue, color: c.color }}>{c.value ?? 0}</div>
              <div style={styles.statLabel}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Appointments ── */}
      {tab === 'appointments' && (
        <div>
          <div style={styles.tableHeader}>
            <p style={{ color:'#888', fontSize:'0.9rem' }}>{filteredAppts.length} appointments</p>
            <input type="text" placeholder="🔍 Search..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)} style={styles.searchInput} />
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  {['Patient','Doctor','Date','Slot','Status','Update'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAppts.map(a => {
                  const badge = BADGE[a.status] || BADGE.pending;
                  return (
                    <tr key={a._id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ fontWeight:700 }}>{a.user?.name}</div>
                        <div style={{ fontSize:'0.78rem', color:'#999' }}>{a.user?.email}</div>
                      </td>
                      <td style={styles.td}>Dr. {a.doctor?.name}<br/><span style={{ fontSize:'0.78rem', color:'#1a73e8' }}>{a.doctor?.specialization}</span></td>
                      <td style={styles.td}>{new Date(a.appointmentDate).toLocaleDateString()}</td>
                      <td style={styles.td}>{a.timeSlot}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background:badge.bg, color:badge.color }}>{a.status}</span>
                      </td>
                      <td style={styles.td}>
                        <select value={a.status} onChange={e => updateStatus(a._id, e.target.value)} style={styles.select}>
                          {['pending','confirmed','completed','cancelled'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Doctors ── */}
      {tab === 'doctors' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
            <p style={{ color:'#888', fontSize:'0.9rem' }}>{doctors.length} doctors registered</p>
            <button onClick={openAddForm} style={styles.addBtn}>+ Add New Doctor</button>
          </div>

          <div style={styles.doctorGrid}>
            {doctors.map(doc => {
              const photoUrl = doc.photo ? `${API}/uploads/${doc.photo}` : null;
              return (
                <div key={doc._id} style={styles.doctorCard}>
                  <div style={styles.docPhotoWrap}>
                    {photoUrl
                      ? <img src={photoUrl} alt={doc.name} style={styles.docPhoto} />
                      : <div style={styles.docPhotoFallback}>{doc.name.charAt(0)}</div>
                    }
                  </div>
                  <div style={styles.docCardBody}>
                    <div style={{ fontWeight:700, fontSize:'1rem' }}>Dr. {doc.name}</div>
                    <div style={{ color:'#1a73e8', fontSize:'0.82rem', fontWeight:600 }}>{doc.specialization}</div>
                    {doc.clinicName && <div style={{ fontSize:'0.8rem', color:'#555', marginTop:'4px' }}>🏥 {doc.clinicName}</div>}
                    {doc.city && <div style={{ fontSize:'0.78rem', color:'#888' }}>📍 {doc.city}, {doc.state}</div>}
                    <div style={{ fontSize:'0.78rem', color:'#888', marginTop:'4px' }}>
                      ⭐ {doc.rating} · ₹{doc.fees} · {doc.experience}yr exp
                    </div>
                    <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}>
                      <button onClick={() => openEditForm(doc)} style={styles.editBtn}>✏️ Edit</button>
                      <button onClick={() => handleDelete(doc._id)} style={styles.deleteBtn}>🗑 Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Add/Edit Doctor Modal ── */}
      {showForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin:0, fontSize:'1.3rem' }}>{editDoctor ? '✏️ Edit Doctor' : '➕ Add New Doctor'}</h2>
              <button onClick={() => setShowForm(false)} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.modalBody}>
              {/* Photo upload */}
              <div style={styles.photoUploadWrap}>
                <div style={styles.photoUploadPreview}>
                  {photoPreview
                    ? <img src={photoPreview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'10px' }} />
                    : <div style={{ fontSize:'2.5rem', color:'#1a73e8' }}>📷</div>
                  }
                </div>
                <div>
                  <label style={styles.uploadLabel}>
                    📁 Choose Doctor Photo
                    <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display:'none' }} />
                  </label>
                  <p style={{ fontSize:'0.78rem', color:'#aaa', marginTop:'6px' }}>JPG, PNG, WEBP · Max 5MB</p>
                </div>
              </div>

              {/* Basic fields */}
              <div style={styles.formGrid}>
                {[
                  { label:'Full Name *',       name:'name',        type:'text',   ph:'Dr. Arjun Sharma' },
                  { label:'Experience (years)*', name:'experience', type:'number', ph:'10' },
                  { label:'Consultation Fees (₹)*', name:'fees',   type:'number', ph:'500' },
                  { label:'Rating (1-5)',       name:'rating',      type:'number', ph:'4.5' },
                ].map(f => (
                  <div key={f.name} style={styles.field}>
                    <label style={styles.fieldLabel}>{f.label}</label>
                    <input type={f.type} placeholder={f.ph} value={form[f.name] || ''}
                      onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                      style={styles.input} />
                  </div>
                ))}
              </div>

              {/* Specialization */}
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Specialization *</label>
                <select value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} style={styles.input}>
                  {SPECS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Bio */}
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Bio / About</label>
                <textarea rows={3} placeholder="Brief description about the doctor..."
                  value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                  style={{ ...styles.input, resize:'vertical' }} />
              </div>

              {/* Clinic / Location */}
              <div style={styles.sectionTitle}>📍 Clinic & Location</div>
              <div style={styles.formGrid}>
                {[
                  { label:'Clinic Name',    name:'clinicName',    ph:'City Heart Clinic' },
                  { label:'City',           name:'city',          ph:'Hyderabad' },
                  { label:'State',          name:'state',         ph:'Telangana' },
                  { label:'Pincode',        name:'pincode',       ph:'500001' },
                ].map(f => (
                  <div key={f.name} style={styles.field}>
                    <label style={styles.fieldLabel}>{f.label}</label>
                    <input type="text" placeholder={f.ph} value={form[f.name] || ''}
                      onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                      style={styles.input} />
                  </div>
                ))}
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Full Clinic Address</label>
                <input type="text" placeholder="12, MG Road, Banjara Hills"
                  value={form.clinicAddress} onChange={e => setForm({ ...form, clinicAddress: e.target.value })}
                  style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Google Maps Link</label>
                <input type="text" placeholder="https://maps.google.com/?q=..."
                  value={form.mapLink} onChange={e => setForm({ ...form, mapLink: e.target.value })}
                  style={styles.input} />
              </div>

              {/* Available Days */}
              <div style={styles.sectionTitle}>📅 Available Days *</div>
              <div style={styles.checkGrid}>
                {DAYS.map(d => (
                  <label key={d} style={{ ...styles.checkItem, ...(form.availableDays.includes(d) ? styles.checkActive : {}) }}>
                    <input type="checkbox" checked={form.availableDays.includes(d)} onChange={() => toggleDay(d)} style={{ display:'none' }} />
                    {d.slice(0,3)}
                  </label>
                ))}
              </div>

              {/* Available Slots */}
              <div style={styles.sectionTitle}>🕐 Available Time Slots *</div>
              <div style={styles.checkGrid}>
                {SLOTS.map(s => (
                  <label key={s} style={{ ...styles.checkItem, ...(form.availableSlots.includes(s) ? styles.checkActive : {}) }}>
                    <input type="checkbox" checked={form.availableSlots.includes(s)} onChange={() => toggleSlot(s)} style={{ display:'none' }} />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setShowForm(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
                {saving ? 'Saving...' : editDoctor ? 'Update Doctor' : 'Add Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { padding:'40px', maxWidth:'1200px', margin:'0 auto' },
  center: { textAlign:'center', padding:'80px', color:'#888' },
  pageHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'28px' },
  pageTitle: { fontSize:'2rem', fontWeight:800, color:'#222' },
  roleBadge: { background:'#e8f0fe', color:'#1a73e8', padding:'6px 16px', borderRadius:'20px', fontWeight:700, fontSize:'0.85rem' },
  tabs: { display:'flex', gap:'10px', marginBottom:'32px' },
  tab: { padding:'10px 24px', borderRadius:'10px', border:'1.5px solid #ddd', background:'#fff', cursor:'pointer', fontWeight:600, fontSize:'0.9rem', color:'#555' },
  tabActive: { background:'#1a73e8', color:'#fff', borderColor:'#1a73e8' },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:'20px' },
  statCard: { background:'#fff', borderRadius:'16px', padding:'24px 20px', textAlign:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.07)' },
  statIcon: { fontSize:'2rem', marginBottom:'8px' },
  statValue: { fontSize:'2.2rem', fontWeight:800, marginBottom:'4px' },
  statLabel: { fontSize:'0.82rem', color:'#888', fontWeight:600 },
  tableHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' },
  searchInput: { padding:'9px 16px', borderRadius:'20px', border:'1.5px solid #ddd', fontSize:'0.9rem', width:'260px', outline:'none' },
  tableWrap: { overflowX:'auto', background:'#fff', borderRadius:'16px', boxShadow:'0 4px 16px rgba(0,0,0,0.07)' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:'0.88rem' },
  thead: { background:'#f8f9fa' },
  th: { padding:'14px 16px', textAlign:'left', fontWeight:700, color:'#555', borderBottom:'2px solid #eee' },
  tr: { borderBottom:'1px solid #f0f0f0' },
  td: { padding:'14px 16px', color:'#333', verticalAlign:'middle' },
  badge: { padding:'3px 10px', borderRadius:'10px', fontSize:'0.78rem', fontWeight:600 },
  select: { padding:'6px 10px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'0.85rem', cursor:'pointer', outline:'none', background:'#fff' },
  addBtn: { background:'#1a73e8', color:'#fff', border:'none', padding:'10px 22px', borderRadius:'10px', fontWeight:700, fontSize:'0.95rem', cursor:'pointer' },
  doctorGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:'20px' },
  doctorCard: { background:'#fff', borderRadius:'16px', overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,0.08)' },
  docPhotoWrap: { height:'160px', background:'#e8f0fe', overflow:'hidden' },
  docPhoto: { width:'100%', height:'100%', objectFit:'cover' },
  docPhotoFallback: { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', fontWeight:700, color:'#1a73e8' },
  docCardBody: { padding:'16px' },
  editBtn: { padding:'6px 14px', background:'#e8f0fe', color:'#1a73e8', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:600, fontSize:'0.82rem' },
  deleteBtn: { padding:'6px 14px', background:'#ffebee', color:'#c62828', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:600, fontSize:'0.82rem' },

  // Modal
  overlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  modal: { background:'#fff', borderRadius:'20px', width:'100%', maxWidth:'720px', maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden' },
  modalHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 28px', borderBottom:'1px solid #eee' },
  closeBtn: { background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:'#888', padding:'4px' },
  modalBody: { overflowY:'auto', padding:'24px 28px', flex:1 },
  modalFooter: { display:'flex', justifyContent:'flex-end', gap:'12px', padding:'16px 28px', borderTop:'1px solid #eee' },
  cancelBtn: { padding:'10px 24px', background:'#fff', color:'#555', border:'1.5px solid #ddd', borderRadius:'10px', cursor:'pointer', fontWeight:600 },
  saveBtn: { padding:'10px 28px', background:'#1a73e8', color:'#fff', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:700, fontSize:'0.95rem' },

  photoUploadWrap: { display:'flex', alignItems:'center', gap:'20px', marginBottom:'20px', padding:'16px', background:'#f8f9ff', borderRadius:'12px', border:'1px dashed #c5d5f5' },
  photoUploadPreview: { width:'80px', height:'80px', borderRadius:'10px', background:'#e8f0fe', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 },
  uploadLabel: { display:'inline-block', padding:'8px 18px', background:'#1a73e8', color:'#fff', borderRadius:'8px', cursor:'pointer', fontWeight:600, fontSize:'0.88rem' },

  formGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'4px' },
  field: { marginBottom:'14px' },
  fieldLabel: { display:'block', fontSize:'0.85rem', fontWeight:600, color:'#444', marginBottom:'6px' },
  input: { width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1.5px solid #ddd', fontSize:'0.92rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit' },
  sectionTitle: { fontSize:'1rem', fontWeight:700, color:'#333', margin:'18px 0 10px', borderBottom:'1px solid #eee', paddingBottom:'6px' },
  checkGrid: { display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'6px' },
  checkItem: { padding:'7px 14px', borderRadius:'20px', border:'1.5px solid #ddd', cursor:'pointer', fontSize:'0.82rem', fontWeight:600, color:'#555', userSelect:'none' },
  checkActive: { background:'#1a73e8', color:'#fff', borderColor:'#1a73e8' },
};

export default AdminDashboard;
