import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase'; 
import { createUserWithEmailAndPassword } from 'firebase/auth'; 
import { collection, onSnapshot, doc, writeBatch, setDoc, getDocs, deleteDoc } from 'firebase/firestore'; 
import { logActivity } from './utils/logger'; 
import { useAuth } from './context/AuthContext'; // <-- ADDED GLOBAL IMPORT (Adjust path if your folder structure is different!)
import { 
  Shield, Zap, Award, Star, Trophy, Music, Megaphone, Camera, 
  ShieldAlert, BookOpen, RotateCcw, RotateCw, UserPlus, Save, X, Edit3,
  Archive, FastForward, AlertTriangle, Eye, History, RefreshCcw, Database
} from 'lucide-react';

const TeamHierarchy = ({ role }) => {
  const [members, setMembers] = useState([]);
  const [draft, setDraft] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // --- ROLLOVER STATES ---
  const [rollOverStep, setRollOverStep] = useState(0); 
  const [newPres, setNewPres] = useState({ name: '', email: '', password: '' });

  // --- TIME MACHINE & ARCHIVE STATES ---
  const [showArchive, setShowArchive] = useState(false);
  const [archivedTeams, setArchivedTeams] = useState([]);
  const [archiveStep, setArchiveStep] = useState('list'); 
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [restorePres, setRestorePres] = useState({ name: '', email: '', password: '' });

  // --- REPLACED LOCAL STATE WITH GLOBAL CONTEXT ---
  const { viewModeArchive, setViewModeArchive } = useAuth(); 

  const [formData, setFormData] = useState({ 
    email: '', name: '', position: '', year: 'TE', role: 'member', hierarchyLevel: 6, team: 'Technical' 
  });

  const canEdit = role === 'admin' && !viewModeArchive;

  // 🧹 WORKSPACE COLLECTIONS TO BACKUP & WIPE 
  const collectionsToWipe = ["notices", "events", "tasks", "queries", "activity_logs"];

  const getTeamName = (pos = '') => {
    const p = pos.toLowerCase();
    if (p.includes('cultural') || p.includes('art') || p.includes('anchor') || p.includes('event') || p.includes('dance')) return 'Cultural';
    if (p.includes('sport')) return 'Sport';
    if (p.includes('technical') || p.includes('developer')) return 'Technical';
    if (/\bpr\b/.test(p) || p.includes('marketing')) return 'PR'; 
    if (p.includes('multimedia') || p.includes('social media') || p.includes('designer') || p.includes('videographer')) return 'Multimedia';
    if (p.includes('discipline')) return 'Discipline';
    if (p.includes('documentation') || p.includes('magazine') || p.includes('report')) return 'Drafting';
    return 'Core'; 
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data(), team: d.data().team || getTeamName(d.data().position) }));
      data.sort((a, b) => (a.hierarchyLevel || 99) - (b.hierarchyLevel || 99));
      setMembers(data);
      if (draft.length === 0) setDraft(data);
    });
    return () => unsubscribe();
  }, []);

  const fetchArchives = async () => {
    const snap = await getDocs(collection(db, "archives"));
    setArchivedTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setShowArchive(true);
    setArchiveStep('list');
  };

  const handleTemporaryRestore = () => {
    setViewModeArchive(selectedArchive);
    setShowArchive(false);
    setArchiveStep('list');
  };

  // --- DEEP PERMANENT RESTORE ENGINE ---
  const executePermanentRestore = async (e) => {
    e.preventDefault();
    setShowArchive(false);
    setRollOverStep(5); 

    try {
      // 1. Wipe the current active auxiliary collections
      for (const colName of collectionsToWipe) {
        const snap = await getDocs(collection(db, colName));
        await Promise.all(snap.docs.map(d => deleteDoc(doc(db, colName, d.id))));
      }

      // 2. Unpack and Restore auxiliary collections from the Archive Time Capsule
      for (const colName of collectionsToWipe) {
        if (selectedArchive[colName] && selectedArchive[colName].length > 0) {
          await Promise.all(selectedArchive[colName].map(item => {
            const { id, ...data } = item;
            return setDoc(doc(db, colName, id), data);
          }));
        }
      }

      const batch = writeBatch(db);

      // 3. Wipe current users & Restore old members
      members.forEach(m => batch.delete(doc(db, "users", m.id)));
      selectedArchive.members.forEach(m => {
        if (m.position === 'President') {
          m.name = restorePres.name; m.email = restorePres.email; m.id = restorePres.email;
        }
        batch.set(doc(db, "users", m.id || m.email), m);
      });
      await batch.commit();

      // 4. Create Auth Key & Refresh
      await createUserWithEmailAndPassword(auth, restorePres.email, restorePres.password);
      await logActivity("System Admin", "President", "Timeline Restored", `Permanently restored ${selectedArchive.id}`);
      
      setTimeout(() => { window.location.href = "/dashboard"; }, 4000);
    } catch (error) {
      console.error("Restore Error:", error);
      alert("Failed to restore timeline: " + error.message);
      setRollOverStep(0);
    }
  };

  // --- DEEP ROLLOVER ENGINE ---
  const executeRollOver = async (e) => {
    e.preventDefault();
    setRollOverStep(3); 

    setTimeout(async () => {
      setRollOverStep(4); 
      try {
        const termName = `TITANS ${new Date().getFullYear()}-${new Date().getFullYear()+1}`;
        
        // 1. Create the Deep Backup Object
        const timeCapsule = { 
          term: termName, 
          archivedAt: new Date().toISOString(),
          members: members,
        };

        // 2. Read and pack all auxiliary collections into the Time Capsule
        for (const colName of collectionsToWipe) {
          const snap = await getDocs(collection(db, colName));
          timeCapsule[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // 3. Wipe them from the live database as we go
          await Promise.all(snap.docs.map(d => deleteDoc(doc(db, colName, d.id))));
        }

        // 4. Save the packed Time Capsule to Archives
        await setDoc(doc(db, "archives", termName), timeCapsule);

        // 5. Wipe user roster and set new President
        const batch = writeBatch(db);
        members.forEach(m => { batch.delete(doc(db, "users", m.id)); });
        const newPresRef = doc(db, "users", newPres.email);
        batch.set(newPresRef, { email: newPres.email, name: newPres.name, position: "President", year: "TE", role: "admin", hierarchyLevel: 1, team: "Core" });
        await batch.commit();

        // 6. Create Auth Account & Refresh
        await createUserWithEmailAndPassword(auth, newPres.email, newPres.password);
        setTimeout(() => { window.location.href = "/dashboard"; }, 3500);
      } catch (error) {
        console.error("Roll Over Error:", error);
        alert("Failed to complete roll over: " + error.message);
        setRollOverStep(0);
      }
    }, 4500);
  };

  const saveSnapshot = () => { setHistory([...history, JSON.stringify(draft)]); setRedoStack([]); };
  const undo = () => { if (history.length === 0) return; setRedoStack([...redoStack, JSON.stringify(draft)]); setDraft(JSON.parse(history[history.length - 1])); setHistory(history.slice(0, -1)); };
  const redo = () => { if (redoStack.length === 0) return; setHistory([...history, JSON.stringify(draft)]); setDraft(JSON.parse(redoStack[redoStack.length - 1])); setRedoStack(redoStack.slice(0, -1)); };

  const addToDraft = (e) => {
    e.preventDefault(); saveSnapshot();
    setDraft([...draft, { ...formData, id: `temp-${Date.now()}`, hierarchyLevel: parseInt(formData.hierarchyLevel, 10), status: 'active' }]);
    setShowAddModal(false);
    setFormData({ email: '', name: '', position: '', year: 'TE', role: 'member', hierarchyLevel: 6, team: 'Technical' });
  };

  const removeFromDraft = (id, position) => {
    if (position === 'President') return alert("Presidential post is locked.");
    saveSnapshot(); setDraft(draft.filter(m => m.id !== id));
  };

  const updateMemberInDraft = (id, field, value) => { saveSnapshot(); setDraft(draft.map(m => m.id === id ? { ...m, [field]: value } : m)); };

  const commitChanges = async () => {
    try {
      const batch = writeBatch(db);
      draft.forEach((m) => {
        const isNew = m.id.startsWith('temp');
        const ref = doc(db, "users", isNew ? m.email : m.id);
        const { id, ...data } = m;
        batch.set(ref, data, { merge: true });
      });
      await batch.commit();
      await logActivity("System Admin", "President", "Synchronized Team Data", `Updated structure for ${draft.length} committee members`);
      setHistory([]); alert("TITANS Data Sync Complete.");
    } catch (error) { console.error("Sync Error:", error); }
  };

  const activeData = viewModeArchive ? viewModeArchive.members : draft;
  const getMember = (pos) => activeData.find(m => m.position === pos) || { id: 'unassigned', name: "Not Assigned", class: "TBD" };
  const getTeam = (teamName) => activeData.filter(m => m.team === teamName);
  const isChanged = !viewModeArchive && JSON.stringify(members) !== JSON.stringify(draft);

  const deptConfigs = {
    "Technical": { icon: <Zap size={14}/>, color: "border-blue-500", textHover: "group-hover:text-blue-600" },
    "Cultural": { icon: <Music size={14}/>, color: "border-pink-500", textHover: "group-hover:text-pink-600" },
    "Sport": { icon: <Trophy size={14}/>, color: "border-emerald-500", textHover: "group-hover:text-emerald-600" },
    "PR": { icon: <Megaphone size={14}/>, color: "border-purple-500", textHover: "group-hover:text-purple-600" },
    "Multimedia": { icon: <Camera size={14}/>, color: "border-indigo-500", textHover: "group-hover:text-indigo-600" },
    "Discipline": { icon: <ShieldAlert size={14}/>, color: "border-red-600", textHover: "group-hover:text-red-700" },
    "Drafting": { icon: <BookOpen size={14}/>, color: "border-teal-500", textHover: "group-hover:text-teal-600" }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto antialiased relative">
      
      {/* ========================================== */}
      {/* FULL SCREEN CINEMATICS (Z-100)             */}
      {/* ========================================== */}
      
      {rollOverStep === 3 && (
        <div className="fixed inset-0 bg-[#050505] z-[100] flex items-center justify-center p-8 text-center animate-in fade-in duration-1000">
          <h1 className="text-3xl md:text-5xl font-black text-white/90 tracking-tighter leading-tight animate-pulse">
            President Bhoomika's reign has ended.<br/>
            <span className="text-[#FFB100] text-xl md:text-3xl block mt-4 tracking-widest uppercase">Thank You for your Contribution.</span>
          </h1>
        </div>
      )}

      {rollOverStep === 4 && (
        <div className="fixed inset-0 bg-[#1B264F] z-[100] flex items-center justify-center p-8 text-center animate-in fade-in duration-1000">
          <div className="max-w-3xl">
            <Star className="text-[#FFB100] mx-auto mb-6" size={64} fill="currentColor"/>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight">
              Welcome President {newPres.name}.<br/>
              <span className="text-emerald-400 text-xl md:text-2xl block mt-6 tracking-widest uppercase leading-snug">Congratulation for being selected as the president of TITANS.</span>
            </h1>
            <p className="text-white/50 mt-10 text-xs font-bold uppercase tracking-widest animate-pulse">Initializing New Workspace & Archiving Data...</p>
          </div>
        </div>
      )}

      {rollOverStep === 5 && (
        <div className="fixed inset-0 bg-emerald-900 z-[100] flex items-center justify-center p-8 text-center animate-in fade-in duration-1000">
          <div className="max-w-3xl">
            <History className="text-emerald-400 mx-auto mb-6 animate-spin-slow" size={64} />
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight">
              Welcome Back, President {restorePres.name}.<br/>
              <span className="text-emerald-400 text-xl md:text-2xl block mt-6 tracking-widest uppercase leading-snug">Timeline {selectedArchive?.id} has been permanently restored.</span>
            </h1>
            <p className="text-white/50 mt-10 text-xs font-bold uppercase tracking-widest animate-pulse">Unpacking Historical Database...</p>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MAIN DASHBOARD UI                          */}
      {/* ========================================== */}

      {/* TIME MACHINE: TEMPORARY VIEW BANNER */}
      {viewModeArchive && (
        <div className="bg-emerald-50 text-emerald-900 py-3 px-6 rounded-2xl flex justify-between items-center shadow-lg border-2 border-emerald-500 mb-6 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3 font-black uppercase tracking-widest text-sm">
            <Eye className="animate-pulse text-emerald-600" size={24} /> 
            <div>
              Viewing Archive: {viewModeArchive.id} 
              <span className="block text-[9px] opacity-70 mt-0.5">Read-Only Historical Blueprint Active</span>
            </div>
          </div>
          <button onClick={() => setViewModeArchive(null)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition shadow-md flex items-center gap-2">
            <RotateCcw size={14}/> Return to Active Term
          </button>
        </div>
      )}

      {/* ADMIN TOOLBAR */}
      {canEdit && (
        <div className="flex justify-between items-center bg-white py-3 px-4 rounded-2xl shadow-sm border border-slate-200 mb-6 overflow-x-auto">
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg shrink-0">
            <button onClick={undo} disabled={history.length === 0} title="Undo" className="p-1.5 hover:bg-white rounded-md disabled:opacity-20 transition"><RotateCcw size={16}/></button>
            <button onClick={redo} disabled={redoStack.length === 0} title="Redo" className="p-1.5 hover:bg-white rounded-md disabled:opacity-20 transition"><RotateCw size={16}/></button>
          </div>
          
          <div className="flex gap-2 shrink-0 ml-4">
            <button onClick={fetchArchives} className="bg-slate-100 text-slate-600 border border-slate-200 px-4 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-slate-200 transition uppercase tracking-wider">
              <Archive size={14}/> Team Archive
            </button>
            <button onClick={() => setRollOverStep(1)} className="bg-purple-600 text-white px-4 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-purple-700 transition uppercase tracking-wider shadow-md">
              <FastForward size={14}/> Roll Over Term
            </button>
            <button onClick={() => setShowAddModal(true)} className="bg-[#1B264F] text-white px-4 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-slate-800 transition uppercase tracking-wider">
              <UserPlus size={14}/> Add Member
            </button>
            {isChanged && (
              <button onClick={commitChanges} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 shadow-md uppercase tracking-wider animate-pulse">
                <Save size={14}/> Sync Data
              </button>
            )}
          </div>
        </div>
      )}

      {/* CORE LEADERSHIP HERO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 opacity-100 transition-opacity">
        <div className={`lg:col-span-8 bg-[#1B264F] rounded-[1.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[260px] shadow-xl border-b-[8px] border-[#FFB100] group ${viewModeArchive ? 'ring-4 ring-emerald-500' : ''}`}>
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
            <img src="/image.png" alt="Phoenix" className="w-[350px]" />
          </div>
          <div className="relative z-10">
            <div className="flex gap-1.5 text-[#FFB100] mb-3">
              <Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/>
            </div>
            <div className="flex items-center gap-3 mt-4">
              {canEdit && editingId === getMember("President").id ? (
                <input className="bg-white/10 border-b-2 border-[#FFB100] text-4xl font-black outline-none px-1" value={getMember("President").name} autoFocus onBlur={() => setEditingId(null)} onChange={(e) => updateMemberInDraft(getMember("President").id, 'name', e.target.value)} />
              ) : (
                <><h2 className="text-4xl font-black tracking-tighter">{getMember("President").name}</h2>{canEdit && <button onClick={() => setEditingId(getMember("President").id)} className="opacity-0 group-hover:opacity-100 transition text-[#FFB100]"><Edit3 size={16}/></button>}</>
              )}
            </div>
            <p className="text-[#FFB100] font-black mt-1 uppercase tracking-widest text-xs">BE IT • TITANS PRESIDENT <br/><span className="text-[10px] text-white/80 tracking-widest mt-1 block">FIRST IN COMMAND</span></p>
          </div>
        </div>

        <div className={`lg:col-span-4 bg-[#800000] rounded-[1.5rem] p-8 text-white shadow-lg border-b-[8px] border-[#FFB100] flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform ${viewModeArchive ? 'ring-4 ring-emerald-500' : ''}`}>
          <Star className="text-[#FFB100] opacity-10 absolute right-[-20px] top-[-20px] pointer-events-none" size={120}/>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-3">
              <div className="flex gap-1.5 text-[#FFB100]"><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/></div>
              {canEdit && <button onClick={() => setEditingId(getMember("Vice President").id)} className="opacity-0 group-hover:opacity-100 transition text-red-200 hover:text-[#FFB100]"><Edit3 size={14}/></button>}
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-red-200 mb-1">Vice President</p>
            {canEdit && editingId === getMember("Vice President").id ? (
              <input className="bg-white/10 border-b border-white w-full text-2xl font-bold outline-none mt-1" value={getMember("Vice President").name} onBlur={() => setEditingId(null)} onChange={(e) => updateMemberInDraft(getMember("Vice President").id, 'name', e.target.value)} />
            ) : (
              <h3 className="text-2xl font-bold tracking-tight mt-1">{getMember("Vice President").name}</h3>
            )}
            <p className="text-[10px] font-bold text-red-100 mt-0.5 opacity-90 uppercase tracking-widest">Second in command</p>
          </div>
        </div>
      </div>

      {/* EXECUTIVES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {["Secretary", "Treasurer", "Associate Treasurer"].map(pos => (
          <div key={pos} className={`bg-white p-5 rounded-[1.5rem] border border-slate-200 border-b-[6px] border-b-[#FFB100] shadow-sm flex items-center justify-between group transition-all hover:-translate-y-1 ${viewModeArchive ? 'ring-2 ring-emerald-500/50' : ''}`}>
            <div>
              <div className="flex gap-1 text-[#FFB100] mb-1.5"><Star size={10} fill="currentColor"/></div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{pos}</p>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-[#1B264F] tracking-tight">{getMember(pos).name}</h4>
                {canEdit && <button onClick={() => setEditingId(getMember(pos).id)} className="opacity-0 group-hover:opacity-100 transition text-slate-300 hover:text-[#FFB100]"><Edit3 size={12}/></button>}
              </div>
            </div>
            <Award size={20} className="text-slate-100 group-hover:text-[#FFB100] transition-colors"/>
          </div>
        ))}
      </div>

      {/* DEPARTMENTS (FLEX-GROW BENTO BOX) */}
      <div className="flex flex-wrap gap-5 pb-20">
        {Object.keys(deptConfigs).map((dept) => {
          const teamMembers = getTeam(dept);
          const count = teamMembers.length;
          if (count === 0) return null;

          let bentoClass = "flex-grow basis-full sm:basis-[40%] lg:basis-[25%] xl:basis-[20%]";
          if (count >= 5) bentoClass = "flex-grow basis-full lg:basis-[45%] xl:basis-[35%]";
          if (count >= 10) bentoClass = "flex-grow basis-full xl:basis-[50%]";

          return (
            <div key={dept} className={`bg-white p-6 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all group border-t-[6px] border border-x-slate-100 border-b-slate-100 flex flex-col ${deptConfigs[dept].color} ${bentoClass} ${viewModeArchive ? 'ring-2 ring-emerald-500/30' : ''}`}>
              <div className="flex justify-between items-center mb-5">
                <h4 className={`font-black text-[10px] uppercase tracking-widest text-slate-400 transition-colors ${deptConfigs[dept].textHover}`}>{dept} Team</h4>
                <div className={`text-slate-200 transition-colors ${deptConfigs[dept].textHover}`}>{deptConfigs[dept].icon}</div>
              </div>
              <div className={`gap-x-6 gap-y-4 flex-1 ${count >= 5 ? 'columns-1 sm:columns-2' : 'space-y-4'}`}>
                {teamMembers.map(m => (
                  <div key={m.id} className="relative group/member pl-3 border-l-2 border-slate-100 hover:border-slate-300 transition-all break-inside-avoid mb-4 inline-block w-full">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">{m.position}</p>
                    <p className="text-xs font-bold text-[#1B264F] tracking-tight">{m.name}</p>
                    {canEdit && <button onClick={() => removeFromDraft(m.id, m.position)} className="absolute right-0 top-1 opacity-0 group-hover/member:opacity-100 transition text-red-400 hover:text-red-600 bg-red-50 p-1 rounded"><X size={10}/></button>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* MODALS AND OVERLAYS                        */}
      {/* ========================================== */}

      {/* --- ADD MEMBER MODAL --- */}
      {showAddModal && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-[1.5rem] p-8 w-full max-w-lg shadow-2xl border-t-[8px] border-[#1B264F]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-[#1B264F] uppercase tracking-tighter">Add Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-red-500 transition"><X size={18}/></button>
            </div>
            <form onSubmit={addToDraft} className="space-y-4">
              <div><label className="text-[10px] font-black uppercase text-slate-500 pl-1 mb-1 block">TITANS Email Address</label><input type="email" required placeholder="position.titans@tcoer.edu.in" className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black uppercase text-slate-500 pl-1 mb-1 block">Full Name</label><input type="text" required className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/></div>
                <div><label className="text-[10px] font-black uppercase text-slate-500 pl-1 mb-1 block">Official Title</label><input type="text" required className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})}/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black uppercase text-slate-500 pl-1 mb-1 block">Department</label><select className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.team} onChange={e => setFormData({...formData, team: e.target.value})}>{Object.keys(deptConfigs).map(d => <option key={d} value={d}>{d} Team</option>)}</select></div>
                <div><label className="text-[10px] font-black uppercase text-slate-500 pl-1 mb-1 block">Academic Year</label><select className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})}><option value="SE">SE</option><option value="TE">TE</option><option value="BE">BE</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div><label className="text-[10px] font-black uppercase text-slate-500 pl-1 mb-1 block">Access Role</label><select className="w-full p-3 text-xs bg-white border border-slate-200 rounded-lg outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}><option value="member">Member</option><option value="executive">Executive</option><option value="admin">Admin</option></select></div>
                <div><label className="text-[10px] font-black uppercase text-slate-500 pl-1 mb-1 block">Hierarchy (1-10)</label><input type="number" min="1" max="10" required className="w-full p-3 text-xs bg-white border border-slate-200 rounded-lg outline-none" value={formData.hierarchyLevel} onChange={e => { e.target.setCustomValidity(''); setFormData({...formData, hierarchyLevel: e.target.value}); }} onInvalid={e => e.target.setCustomValidity('Enter a rank between 1 and 10.')}/></div>
              </div>
              <button className="w-full bg-[#1B264F] hover:bg-[#FFB100] hover:text-[#1B264F] text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest mt-6 transition-colors shadow-md">Confirm & Add</button>
            </form>
          </div>
        </div>
      )}

      {/* --- TIME MACHINE ARCHIVE MODAL --- */}
      {showArchive && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-[1.5rem] p-8 w-full max-w-3xl shadow-2xl border-t-[8px] border-slate-500 max-h-[85vh] flex flex-col relative overflow-hidden">
            
            <div className="flex justify-between items-center mb-6 shrink-0 border-b border-slate-100 pb-4 relative z-10">
              <h3 className="text-lg font-black text-slate-700 uppercase tracking-tighter flex items-center gap-2"><Archive size={20}/> TITANS History Archive</h3>
              <button onClick={() => setShowArchive(false)} className="text-slate-400 hover:text-red-500 transition"><X size={18}/></button>
            </div>

            {/* View 1: List of Archives */}
            {archiveStep === 'list' && (
              <div className="overflow-y-auto flex-1 custom-scrollbar pr-2 relative z-10">
                {archivedTeams.length === 0 ? (
                  <div className="text-center py-20 opacity-50"><Archive size={48} className="mx-auto mb-3 text-slate-400"/><p className="text-sm font-bold text-slate-500">No archived teams found yet.</p></div>
                ) : (
                  <div className="space-y-6">
                    {archivedTeams.map(arc => (
                      <div key={arc.id} className="border border-slate-200 rounded-2xl p-6 bg-slate-50 hover:border-slate-300 transition-colors">
                        <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-4">
                          <div>
                            <h4 className="font-black text-xl text-[#1B264F] uppercase tracking-widest mb-1">{arc.id}</h4>
                            <div className="flex gap-2 text-[9px] font-bold text-slate-500 uppercase">
                              <span className="bg-slate-200 px-2 py-0.5 rounded">{arc.members?.length || 0} Members</span>
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1"><Database size={10}/> {arc.events?.length || 0} Events Saved</span>
                              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{arc.tasks?.length || 0} Tasks Saved</span>
                            </div>
                          </div>
                          <button onClick={() => { setSelectedArchive(arc); setArchiveStep('choose'); }} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:bg-black transition"><RefreshCcw size={12}/> Restore Term</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {arc.members?.slice(0,6).map(m => (
                            <div key={m.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                              <div className="w-1 h-full bg-[#1B264F] rounded-full"></div>
                              <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{m.position}</p><p className="text-xs font-bold text-[#1B264F] tracking-tight truncate w-32">{m.name}</p></div>
                            </div>
                          ))}
                          {arc.members?.length > 6 && <div className="text-xs font-bold text-slate-400 flex items-center pl-2">+ {arc.members.length - 6} more</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* View 2: Choose Restore Type */}
            {archiveStep === 'choose' && (
              <div className="flex-1 flex flex-col justify-center items-center text-center animate-in slide-in-from-right-8 relative z-10">
                <History size={48} className="text-slate-300 mb-4"/>
                <h2 className="text-2xl font-black text-[#1B264F] uppercase tracking-widest mb-2">Restore {selectedArchive?.id}</h2>
                <p className="text-sm text-slate-500 mb-8 max-w-md">How would you like to interact with this timeline?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <button onClick={handleTemporaryRestore} className="bg-emerald-50 border-2 border-emerald-500 p-6 rounded-2xl hover:bg-emerald-100 transition group text-left">
                    <Eye size={24} className="text-emerald-600 mb-3 group-hover:scale-110 transition-transform"/>
                    <h3 className="font-black text-emerald-900 uppercase tracking-widest mb-1">Temporary View</h3>
                    <p className="text-xs text-emerald-700 font-medium">Read-only historical view of the team structure.</p>
                  </button>
                  <button onClick={() => setArchiveStep('permanent_form')} className="bg-red-50 border-2 border-red-500 p-6 rounded-2xl hover:bg-red-100 transition group text-left">
                    <AlertTriangle size={24} className="text-red-600 mb-3 group-hover:scale-110 transition-transform"/>
                    <h3 className="font-black text-red-900 uppercase tracking-widest mb-1">Permanent Restore</h3>
                    <p className="text-xs text-red-700 font-medium">Destructive. Deletes current timeline and reinstates all old data.</p>
                  </button>
                </div>
                <button onClick={() => setArchiveStep('list')} className="mt-8 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">← Back to Archives</button>
              </div>
            )}

            {/* View 3: Permanent Restore Form */}
            {archiveStep === 'permanent_form' && (
              <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right-8 relative z-10">
                <div className="bg-red-100 border border-red-200 text-red-800 p-4 rounded-xl mb-6 flex gap-3 items-start">
                  <AlertTriangle size={20} className="shrink-0 mt-0.5"/>
                  <div className="text-xs font-medium leading-relaxed">
                    <strong className="block uppercase tracking-widest font-black mb-1">Warning: Destructive Timeline Event</strong>
                    You are about to delete the current active administration, wipe the workspace, and permanently restore {selectedArchive?.id}. To authorize this, provide the returning President's new login credentials.
                  </div>
                </div>
                <form onSubmit={executePermanentRestore} className="space-y-4">
                  <div><label className="text-[10px] font-black uppercase text-slate-500 pl-1 mb-1 block">Returning President's Name</label><input type="text" required className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500 transition" value={restorePres.name} onChange={e => setRestorePres({...restorePres, name: e.target.value})}/></div>
                  <div><label className="text-[10px] font-black uppercase text-slate-500 pl-1 mb-1 block">Authentication Email</label><input type="email" required className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500 transition" value={restorePres.email} onChange={e => setRestorePres({...restorePres, email: e.target.value})}/></div>
                  <div><label className="text-[10px] font-black uppercase text-slate-500 pl-1 mb-1 block">New Master Password</label><input type="password" required className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500 transition" value={restorePres.password} onChange={e => setRestorePres({...restorePres, password: e.target.value})}/></div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setArchiveStep('choose')} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold text-xs uppercase rounded-xl hover:bg-slate-200 transition">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-red-600 text-white font-black text-xs uppercase rounded-xl hover:bg-red-700 transition shadow-md flex items-center justify-center gap-2"><RefreshCcw size={14}/> Execute Restore</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- NORMAL ROLLOVER CONFIRMATION MODALS --- */}
      {rollOverStep === 1 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in-95">
          <div className="bg-white rounded-[1.5rem] p-8 w-full max-w-md shadow-2xl border-t-[8px] border-purple-600 text-center">
            <AlertTriangle size={48} className="mx-auto text-purple-600 mb-4"/>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">Initialize Term Rollover</h3>
            <p className="text-xs text-slate-500 font-medium mb-8 leading-relaxed">
              Are you sure you want to roll over to the next term? This will permanently archive the current team, backup all active data, and completely reset the workspace for the incoming administration.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRollOverStep(0)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold text-xs uppercase rounded-xl hover:bg-slate-200 transition">Cancel</button>
              <button onClick={() => setRollOverStep(2)} className="flex-1 py-3 bg-purple-600 text-white font-black text-xs uppercase rounded-xl hover:bg-purple-700 transition shadow-md">Yes, Proceed</button>
            </div>
          </div>
        </div>
      )}

      {rollOverStep === 2 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in-95">
          <div className="bg-white rounded-[1.5rem] p-8 w-full max-w-md shadow-2xl border-t-[8px] border-emerald-500">
            <h3 className="text-lg font-black text-[#1B264F] uppercase tracking-tighter mb-1">Incoming Administration</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Setup the next President's Credentials</p>
            <form onSubmit={executeRollOver} className="space-y-4">
              <div><label className="text-[10px] font-black uppercase text-slate-500 pl-1 mb-1 block">President's Name</label><input type="text" required placeholder="e.g., Jane Doe" className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newPres.name} onChange={e => setNewPres({...newPres, name: e.target.value})}/></div>
              <div><label className="text-[10px] font-black uppercase text-slate-500 pl-1 mb-1 block">TITANS Email Address</label><input type="email" required placeholder="president.titans@tcoer.edu.in" className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newPres.email} onChange={e => setNewPres({...newPres, email: e.target.value})}/></div>
              <div><label className="text-[10px] font-black uppercase text-slate-500 pl-1 mb-1 block">Master Password</label><input type="password" required placeholder="Will be used to login immediately" className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newPres.password} onChange={e => setNewPres({...newPres, password: e.target.value})}/></div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-emerald-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg flex justify-center items-center gap-2"><FastForward size={16}/> Execute Rollover</button>
                <button type="button" onClick={() => setRollOverStep(0)} className="w-full mt-3 text-[10px] text-slate-400 font-bold uppercase hover:text-slate-600 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeamHierarchy;