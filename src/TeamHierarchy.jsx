import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { logActivity } from './utils/logger'; // Import the logger
import { 
  Shield, Zap, Award, Star, Trophy, Music, Megaphone, Camera, 
  ShieldAlert, BookOpen, RotateCcw, RotateCw, UserPlus, UserMinus, 
  Save, X, Edit3, Check
} from 'lucide-react';

const TeamHierarchy = ({ role }) => {
  const [members, setMembers] = useState([]);
  const [draft, setDraft] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', position: '', class: '', team: 'Technical' });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMembers(data);
      if (draft.length === 0) setDraft(data);
    });
    return () => unsubscribe();
  }, []);

  // --- UNDO/REDO LOGIC ---
  const saveSnapshot = () => {
    setHistory([...history, JSON.stringify(draft)]);
    setRedoStack([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack([...redoStack, JSON.stringify(draft)]);
    setDraft(JSON.parse(previous));
    setHistory(history.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory([...history, JSON.stringify(draft)]);
    setDraft(JSON.parse(next));
    setRedoStack(redoStack.slice(0, -1));
  };

  // --- MEMBERSHIP ACTIONS ---
  const addToDraft = (e) => {
    e.preventDefault();
    saveSnapshot();
    const newMember = { ...formData, id: `temp-${Date.now()}`, status: 'active' };
    setDraft([...draft, newMember]);
    setShowAddModal(false);
    setFormData({ name: '', position: '', class: '', team: 'Technical' });
  };

  const removeFromDraft = (id, position) => {
    // President Lock Logic
    if (position === 'President') {
      alert("Presidential post is locked and cannot be deleted.");
      return;
    }
    saveSnapshot();
    setDraft(draft.filter(m => m.id !== id));
  };

  const updateMemberInDraft = (id, field, value) => {
    saveSnapshot();
    setDraft(draft.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const commitChanges = async () => {
    try {
      const batch = writeBatch(db);
      draft.forEach((m) => {
        const isNew = m.id.startsWith('temp');
        const ref = doc(db, "users", isNew ? undefined : m.id);
        const { id, ...data } = m;
        batch.set(ref, data);
      });
      
      await batch.commit();

      // Log the administrative action to Activity Logs
      await logActivity(
        "Bhoomika Wandhekar", 
        "President", 
        "Synchronized Team Data", 
        `Updated structure for ${draft.length} committee members`
      );

      setHistory([]);
      alert("TITANS Data Sync Complete.");
    } catch (error) {
      console.error("Sync Error:", error);
    }
  };

  const getMember = (pos) => draft.find(m => m.position === pos) || { name: "Bhoomika Wandhekar", class: "BE" };
  const getTeam = (teamName) => draft.filter(m => m.team === teamName);
  const isChanged = JSON.stringify(members) !== JSON.stringify(draft);

  const deptConfigs = {
    "Technical": { icon: <Zap size={14}/>, color: "group-hover:border-orange-500" },
    "Cultural": { icon: <Music size={14}/>, color: "group-hover:border-emerald-500" },
    "Sport": { icon: <Trophy size={14}/>, color: "group-hover:border-blue-500" },
    "PR": { icon: <Megaphone size={14}/>, color: "group-hover:border-yellow-500" },
    "Multimedia": { icon: <Camera size={14}/>, color: "group-hover:border-purple-500" },
    "Discipline": { icon: <ShieldAlert size={14}/>, color: "group-hover:border-red-800" },
    "Drafting": { icon: <BookOpen size={14}/>, color: "group-hover:border-pink-500" }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto antialiased">
      
      {/* --- ADMIN TOOLBAR --- */}
      <div className="flex justify-between items-center bg-white py-2 px-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button onClick={undo} disabled={history.length === 0} title="Undo" className="p-1.5 hover:bg-white rounded-md disabled:opacity-20 transition"><RotateCcw size={16}/></button>
          <button onClick={redo} disabled={redoStack.length === 0} title="Redo" className="p-1.5 hover:bg-white rounded-md disabled:opacity-20 transition"><RotateCw size={16}/></button>
        </div>
        
        <div className="flex gap-2">
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

      {/* --- PRESIDENT HERO --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-[#1B264F] rounded-[1.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[260px] shadow-xl border-b-[8px] border-[#FFB100] group">
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
            <img src="/image.png" alt="Phoenix" className="w-[350px]" />
          </div>
          <div className="relative z-10">
            <span className="bg-[#FFB100] text-[#1B264F] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Presidential Office</span>
            <div className="flex items-center gap-3 mt-4">
              {editingId === getMember("President").id ? (
                <input 
                  className="bg-white/10 border-b-2 border-[#FFB100] text-4xl font-black outline-none px-1" 
                  value={getMember("President").name} 
                  autoFocus
                  onBlur={() => setEditingId(null)}
                  onChange={(e) => updateMemberInDraft(getMember("President").id, 'name', e.target.value)}
                />
              ) : (
                <>
                  <h2 className="text-4xl font-black tracking-tighter">{getMember("President").name}</h2>
                  <button onClick={() => setEditingId(getMember("President").id)} className="opacity-0 group-hover:opacity-100 transition text-[#FFB100]"><Edit3 size={16}/></button>
                </>
              )}
            </div>
            <p className="text-[#FFB100] font-black mt-1 uppercase tracking-widest text-xs">BE IT • TITANS PRESIDENT</p>
          </div>
        </div>

        {/* Vice President */}
        <div className="lg:col-span-4 bg-[#800000] rounded-[1.5rem] p-8 text-white shadow-lg flex flex-col justify-between relative overflow-hidden group">
          <Star className="text-[#FFB100] opacity-30 group-hover:opacity-100 transition-opacity" size={24}/>
          <div>
            <div className="flex justify-between items-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-red-200">Vice President</p>
              <button onClick={() => setEditingId(getMember("Vice President").id)} className="opacity-0 group-hover:opacity-100 transition text-red-200"><Edit3 size={14}/></button>
            </div>
            {editingId === getMember("Vice President").id ? (
              <input 
                className="bg-white/10 border-b border-white w-full text-2xl font-bold outline-none mt-1" 
                value={getMember("Vice President").name} 
                onBlur={() => setEditingId(null)}
                onChange={(e) => updateMemberInDraft(getMember("Vice President").id, 'name', e.target.value)}
              />
            ) : (
              <h3 className="text-2xl font-bold tracking-tight mt-1">{getMember("Vice President").name}</h3>
            )}
            <p className="text-[10px] font-bold text-red-100 mt-0.5 opacity-70 uppercase">Operations & Strategy</p>
          </div>
        </div>
      </div>

      {/* --- EXECUTIVES --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {["Secretary", "Treasurer", "Associate Treasurer"].map(pos => (
          <div key={pos} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-[#1B264F] transition-all">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{pos}</p>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-[#1B264F] tracking-tight">{getMember(pos).name}</h4>
                <button onClick={() => setEditingId(getMember(pos).id)} className="opacity-0 group-hover:opacity-100 transition text-slate-300"><Edit3 size={12}/></button>
              </div>
            </div>
            <Award size={16} className="text-[#FFB100] opacity-30 group-hover:opacity-100 transition-opacity"/>
          </div>
        ))}
      </div>

      {/* --- DEPARTMENTS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Object.keys(deptConfigs).map((dept) => (
          <div key={dept} className={`bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group border-t-4 ${deptConfigs[dept]?.color || 'hover:border-[#1B264F]'}`}>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-black text-[9px] uppercase tracking-widest text-slate-400 group-hover:text-[#1B264F]">{dept} Team</h4>
              <div className="text-slate-200 group-hover:text-[#FFB100] transition-colors">{deptConfigs[dept]?.icon}</div>
            </div>
            <div className="space-y-3">
              {getTeam(dept).map(m => (
                <div key={m.id} className="border-l-2 border-slate-50 pl-3 py-0.5 hover:border-[#FFB100] transition-all relative group/member">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">{m.position}</p>
                  <p className="text-xs font-bold text-[#1B264F] tracking-tight">{m.name}</p>
                  <button onClick={() => removeFromDraft(m.id, m.position)} className="absolute right-0 top-1 opacity-0 group-hover/member:opacity-100 transition text-red-400"><X size={10}/></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- ADD MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[1.5rem] p-8 w-full max-w-sm shadow-2xl border-t-[8px] border-[#1B264F]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-black text-[#1B264F] uppercase tracking-tighter">Add Member</h3>
              <button onClick={() => setShowAddModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={addToDraft} className="space-y-3">
              <input placeholder="Name" required className="w-full p-3 text-xs bg-slate-50 border rounded-xl outline-none" onChange={e => setFormData({...formData, name: e.target.value})}/>
              <input placeholder="Post" required className="w-full p-3 text-xs bg-slate-50 border rounded-xl outline-none" onChange={e => setFormData({...formData, position: e.target.value})}/>
              <select className="w-full p-3 text-xs bg-slate-50 border rounded-xl outline-none" onChange={e => setFormData({...formData, team: e.target.value})}>
                {Object.keys(deptConfigs).map(d => <option key={d} value={d}>{d} Team</option>)}
              </select>
              <button className="w-full bg-[#1B264F] text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest mt-2">Update Draft</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamHierarchy;