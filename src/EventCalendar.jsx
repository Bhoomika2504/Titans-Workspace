import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { logActivity } from './utils/logger';
import { useAuth } from './context/AuthContext'; 
import { 
  ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, 
  Tag, AlignLeft, Trash2, Edit3, Grid, CalendarDays, Forward, Info, Eye
} from 'lucide-react';

const EventCalendar = () => {
  const [view, setView] = useState('month'); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dayEventsList, setDayEventsList] = useState([]); 
  
  // --- RBAC & GLOBAL STATE ---
  const { userData, role, viewModeArchive } = useAuth(); 
  const userName = userData?.name || "Unknown User";
  const userPosition = userData?.position || "Member";
  
  // Strict RBAC: Only admin/executives can create or edit events
  const isLeadership = role === 'admin' || role === 'executive';

  const [formData, setFormData] = useState({ 
    title: '', category: 'None', eventIncharge: '', description: '', date: '', repeat: 'once' 
  });

  const categoryColors = {
    "None": "#1B264F", "Coding Club": "#3B82F6", "Art Club": "#EC4899",
    "Technical": "#F97316", "Cultural": "#10B981", "Sports": "#06B6D4"
  };

  useEffect(() => {
    if (viewModeArchive) {
      setEvents(viewModeArchive.events || []);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, "events"), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [viewModeArchive]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!isLeadership || viewModeArchive) return;

    const finalData = { ...formData, color: categoryColors[formData.category], createdAt: serverTimestamp() };
    try {
      if (isEditing) {
        await updateDoc(doc(db, "events", selectedEvent.id), finalData);
        await logActivity(userName, userPosition, "Updated Event", finalData.title);
      } else {
        await addDoc(collection(db, "events"), finalData);
        await logActivity(userName, userPosition, "Created Event", finalData.title);
      }
      closeModal();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id, title) => {
    if (!isLeadership || viewModeArchive) return;

    if (window.confirm(`Delete ${title}?`)) {
      await deleteDoc(doc(db, "events", id));
      await logActivity(userName, userPosition, "Deleted Event", title);
      closeModal();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setDayEventsList([]);
    setIsEditing(false);
    setFormData({ title: '', category: 'None', eventIncharge: '', description: '', date: '', repeat: 'once' });
  };

  const onDateClick = (dateStr) => {
    const filtered = events.filter(e => e.date === dateStr);
    if (filtered.length > 0) {
      if (filtered.length === 1) {
        setSelectedEvent(filtered[0]);
      } else {
        setDayEventsList(filtered);
      }
      setShowModal(true);
    }
  };

  const getPieStyle = (dayEvents) => {
    if (dayEvents.length === 0) return { backgroundColor: 'transparent' };
    if (dayEvents.length === 1) return { backgroundColor: dayEvents[0].color || '#1B264F' };
    let cumulativePercent = 0;
    const segments = dayEvents.map((e) => {
      const start = cumulativePercent;
      cumulativePercent += (100 / dayEvents.length);
      return `${e.color || '#1B264F'} ${start}% ${cumulativePercent}%`;
    });
    return { background: `conic-gradient(${segments.join(', ')})` };
  };

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto antialiased">
      
      {viewModeArchive && (
        <div className="bg-emerald-50 text-emerald-800 p-3 text-center text-xs font-bold uppercase tracking-widest rounded-2xl border-2 border-emerald-500 shadow-sm flex justify-center items-center gap-2 animate-in slide-in-from-top-4">
          <Eye size={16} className="text-emerald-600" /> Viewing Historical Calendar for {viewModeArchive.id}
        </div>
      )}

      <header className="flex justify-between items-center bg-white p-2.5 px-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-black text-[#1B264F] uppercase tracking-tighter">
            {view === 'year' ? `Year ${currentYear}` : `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`}
          </h2>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setCurrentDate(new Date(view === 'year' ? currentYear - 1 : currentYear, view === 'year' ? currentMonth : currentMonth - 1, 1))} className="p-1 hover:bg-white rounded-md transition"><ChevronLeft size={14}/></button>
            <button onClick={() => setCurrentDate(new Date(view === 'year' ? currentYear + 1 : currentYear, view === 'year' ? currentMonth : currentMonth + 1, 1))} className="p-1 hover:bg-white rounded-md transition"><ChevronRight size={14}/></button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setView('year')} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-2 transition ${view === 'year' ? 'bg-[#1B264F] text-white' : 'text-slate-400'}`}><Grid size={12}/> Year</button>
            <button onClick={() => setView('month')} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-2 transition ${view === 'month' ? 'bg-[#1B264F] text-white' : 'text-slate-400'}`}><CalendarDays size={12}/> Month</button>
          </div>
          
          {/* RBAC: ONLY LEADERSHIP CAN ADD EVENTS */}
          {isLeadership && !viewModeArchive && (
            <button onClick={() => { setSelectedEvent(null); setIsEditing(false); setShowModal(true); }} className="bg-[#1B264F] text-white px-4 py-1.5 rounded-lg font-bold text-[9px] uppercase shadow-lg flex items-center gap-1.5">
              <Plus size={14}/> New Event
            </button>
          )}
        </div>
      </header>

      {view === 'year' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(12)].map((_, mIdx) => {
            const totalDays = new Date(currentYear, mIdx + 1, 0).getDate();
            const firstDay = new Date(currentYear, mIdx, 1).getDay();
            const days = [];
            for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`}></div>);
            for (let d = 1; d <= totalDays; d++) {
              const dateStr = `${currentYear}-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const dayEvents = events.filter(e => e.date === dateStr);
              days.push(<div key={d} onClick={() => onDateClick(dateStr)} style={getPieStyle(dayEvents)} className={`h-5 w-5 flex items-center justify-center text-[8px] rounded-full cursor-pointer hover:ring-2 hover:ring-[#FFB100] transition-all shadow-sm ${dayEvents.length > 0 ? 'text-white font-black' : 'text-slate-500'}`}>{d}</div>);
            }
            return (
              <div key={mIdx} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-[10px] font-black uppercase text-[#1B264F] mb-2 border-b pb-1">{new Date(currentYear, mIdx).toLocaleString('default', { month: 'short' })}</h4>
                <div className="grid grid-cols-7 gap-0.5">{days}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-2 text-center text-[9px] font-black text-slate-400 uppercase">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {[...Array(new Date(currentYear, currentMonth, 1).getDay())].map((_, i) => <div key={`empty-${i}`} className="h-20 border border-slate-50 bg-slate-50/20"></div>)}
            {[...Array(new Date(currentYear, currentMonth + 1, 0).getDate())].map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = events.filter(e => e.date === dateStr);
              return (
                <div key={day} onClick={() => onDateClick(dateStr)} className="h-20 border border-slate-100 p-1.5 hover:bg-blue-50/50 transition-all cursor-pointer group">
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#1B264F]">{day}</span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.map(e => <div key={e.id} style={{ backgroundColor: e.color }} className="text-[7px] text-white p-0.5 rounded font-black truncate px-1 shadow-sm">{e.title}</div>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl border-t-[8px]" style={{ borderColor: selectedEvent ? selectedEvent.color : (dayEventsList.length > 0 ? '#1B264F' : categoryColors[formData.category]) }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-[#1B264F] uppercase tracking-tighter">
                {dayEventsList.length > 1 ? "Daily Schedule" : (selectedEvent && !isEditing ? "Event Info" : (isEditing ? "Edit Event" : "Mark New Event"))}
              </h3>
              <button onClick={closeModal}><X size={18}/></button>
            </div>

            {dayEventsList.length > 1 && !selectedEvent && (
              <div className="space-y-3">
                {dayEventsList.map(e => (
                  <button key={e.id} onClick={() => setSelectedEvent(e)} className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-blue-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 rounded-full" style={{ backgroundColor: e.color }}></div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800">{e.title}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{e.category}</p>
                      </div>
                    </div>
                    <Info size={14} className="text-slate-300 group-hover:text-[#1B264F]"/>
                  </button>
                ))}
              </div>
            )}

            {selectedEvent && !isEditing ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <h4 className="text-sm font-black text-[#1B264F]">{selectedEvent.title}</h4>
                  <p className="text-[10px] font-bold text-slate-400">{selectedEvent.date} | Incharge: {selectedEvent.eventIncharge || "N/A"}</p>
                </div>
                <div className="px-1 space-y-3">
                   <div className="flex items-center gap-3"><Tag size={14} className="text-blue-500"/><p className="text-[11px] font-bold uppercase">{selectedEvent.category}</p></div>
                   <div className="flex items-start gap-3"><AlignLeft size={14} className="text-slate-300"/><p className="text-[11px] text-slate-600 leading-relaxed">{selectedEvent.description}</p></div>
                </div>
                
                {/* RBAC: ONLY LEADERSHIP CAN EDIT OR DELETE EVENTS */}
                {isLeadership && !viewModeArchive && (
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                    <button onClick={() => { setFormData(selectedEvent); setIsEditing(true); }} className="p-2 bg-slate-100 rounded-xl flex flex-col items-center gap-1 hover:bg-slate-200 transition"><Edit3 size={14}/><span className="text-[8px] font-bold">EDIT</span></button>
                    <button onClick={() => {/* postpone */}} className="p-2 bg-blue-50 text-blue-600 rounded-xl flex flex-col items-center gap-1 hover:bg-blue-100 transition"><Forward size={14}/><span className="text-[8px] font-bold">POSTPONE</span></button>
                    <button onClick={() => handleDelete(selectedEvent.id, selectedEvent.title)} className="p-2 bg-red-50 text-red-600 rounded-xl flex flex-col items-center gap-1 hover:bg-red-100 transition"><Trash2 size={14}/><span className="text-[8px] font-bold">REMOVE</span></button>
                  </div>
                )}
              </div>
            ) : null}

            {((!selectedEvent && dayEventsList.length === 0) || isEditing) && isLeadership ? (
              <form onSubmit={handleSaveEvent} className="space-y-3">
                <input placeholder="Event Name" required className="w-full p-3 text-xs bg-slate-50 border rounded-xl outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/>
                <select className="w-full p-3 text-xs bg-slate-50 border rounded-xl outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {Object.keys(categoryColors).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <input type="date" required className="w-full p-3 text-xs bg-slate-50 border rounded-xl outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
                <input placeholder="Event Incharge" className="w-full p-3 text-xs bg-slate-50 border rounded-xl outline-none" value={formData.eventIncharge} onChange={e => setFormData({...formData, eventIncharge: e.target.value})}/>
                <textarea placeholder="Description..." rows="3" className="w-full p-3 text-xs bg-slate-50 border rounded-xl outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                <button className="w-full bg-[#1B264F] text-white font-black py-3 rounded-xl text-[10px] uppercase shadow-lg">Confirm Sync</button>
              </form>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;