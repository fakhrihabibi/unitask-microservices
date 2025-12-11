import React, { useState, useEffect } from 'react';

function App() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ title: '', deadline_date: '', deadline_time: '' });

  const refreshData = async () => {
    try {
        const resTasks = await fetch('http://localhost:3000/api/tasks');
        const dataTasks = await resTasks.json();
        setTasks(dataTasks);

        const resUsers = await fetch('http://localhost:3000/api/users');
        const dataUsers = await resUsers.json();
        setUsers(dataUsers);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { refreshData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    refreshData();
    setForm({ title: '', deadline_date: '', deadline_time: '' });
  };

  const updateStatus = async (id, status) => {
    await fetch(`http://localhost:3000/api/tasks/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    refreshData();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{textAlign:'center'}}>🎓 UniTask Microservices</h1>
      
      <div style={{ background: '#e3f2fd', padding: '15px', borderRadius:'8px', marginBottom: '20px' }}>
        <h3>👤 Active Users (via User Service)</h3>
        <div>
        {users.length > 0 ? users.map(u => (
            <span key={u.id} style={{marginRight:'15px', padding:'5px 10px', background:'white', borderRadius:'15px', border:'1px solid #90caf9'}}>
                <b>{u.name}</b> <small>({u.role})</small>
            </span>
        )) : <p>Loading users...</p>}
        </div>
      </div>

      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius:'8px', marginBottom: '20px' }}>
        <h3>➕ Tambah Tugas Baru</h3>
        <form onSubmit={handleSubmit} style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
          <input style={{padding:'8px', flex:'2'}} placeholder="Nama Tugas" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          <input style={{padding:'8px'}} type="date" value={form.deadline_date} onChange={e => setForm({...form, deadline_date: e.target.value})} required />
          <input style={{padding:'8px'}} type="time" value={form.deadline_time} onChange={e => setForm({...form, deadline_time: e.target.value})} required />
          <button style={{padding:'8px 20px', background:'#2196f3', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}} type="submit">Simpan</button>
        </form>
      </div>

      <div>
        <h3>📋 Daftar Tugas (via Task Service + DB)</h3>
        {tasks.length > 0 ? tasks.map(t => (
          <div key={t.id} style={{ borderLeft: t.status === 'DONE' ? '5px solid #4caf50' : t.status === 'ON_PROGRESS' ? '5px solid #ff9800' : '5px solid #f44336', background:'white', boxShadow:'0 2px 5px rgba(0,0,0,0.1)', padding: '15px', margin: '10px 0', borderRadius: '4px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
                <h4 style={{margin:'0 0 5px 0'}}>{t.title} <span style={{fontSize:'0.8em', padding:'2px 8px', borderRadius:'4px', background:'#eee'}}>{t.status}</span></h4>
                <p style={{margin:0, color:'#666', fontSize:'0.9em'}}>📅 {t.deadline_date ? t.deadline_date.split('T')[0] : '-'} | ⏰ {t.deadline_time}</p>
            </div>
            <div style={{display:'flex', gap:'5px'}}>
                <button onClick={() => updateStatus(t.id, 'ON_PROGRESS')} style={{cursor:'pointer', padding:'5px 10px', border:'1px solid #ff9800', background:'white', color:'#ff9800', borderRadius:'4px'}}>Kerjakan</button>
                <button onClick={() => updateStatus(t.id, 'DONE')} style={{cursor:'pointer', padding:'5px 10px', border:'1px solid #4caf50', background:'white', color:'#4caf50', borderRadius:'4px'}}>Selesai</button>
            </div>
          </div>
        )) : <p style={{textAlign:'center', color:'#888'}}>Belum ada tugas.</p>}
      </div>
    </div>
  );
}

export default App;
