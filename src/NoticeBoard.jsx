import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { 
  Megaphone, Send, Clock, ShieldCheck, Edit3, Trash2, X, Check, 
  Search, AlertCircle, Calendar, Tag
} from 'lucide-react';
import { logActivity } from './utils/logger'; 

const NoticeBoard = ({ userName = "Bhoomika Wandhekar", userPosition = "President" }) => {
  const [notices, setNotices] = useState([]);
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General Info');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit States
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const authorizedPositions = ["President", "Vice President", "Secretary"];
  const canPost = authorizedPositions.includes(userPosition);

  const categories = {
    "General Info": { icon: Tag, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    "Urgent Alert": { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
    "Event Update": { icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" }
  };

  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const postNotice = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const officialTitle = `TITANS, ${userPosition}`;
      await addDoc(collection(db, "notices"), {
        text: input,
        category: selectedCategory,
        timestamp: serverTimestamp(),
        author: officialTitle, 
        role: userPosition
      });

      await logActivity(userName, userPosition, "Posted Official Notice", `Category: ${selectedCategory}`);
      setInput('');
      setSelectedCategory('General Info');
    } catch (error) {
      console.error("Error posting notice:", error);
    }
  };

  const handleDelete = async (id, text) => {
    if (window.confirm("Are you sure you want to delete this official notice?")) {
      await deleteDoc(doc(db, "notices", id));
      await logActivity(userName, userPosition, "Deleted Notice", `Removed broadcast.`);
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editText.trim()) return;
    await updateDoc(doc(db, "notices", id), { text: editText });
    await logActivity(userName, userPosition, "Edited Notice", `Updated existing broadcast.`);
    setEditingId(null);
  };

  const filteredNotices = notices.filter(n => 
    n.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (n.category && n.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] antialiased">
      
      {/* ================= LEFT: COMPOSE ================= */}
      <div className="w-full lg:w-1/3 flex flex-col h-full">
        
        {canPost ? (
          <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 bg-[#1B264F] text-white flex items-center gap-2 rounded-t-[1.5rem] shrink-0">
              <Megaphone size={16} className="text-[#FFB100]"/>
              <h3 className="text-xs font-black uppercase tracking-widest">Broadcast Desk</h3>
            </div>
            
            <form onSubmit={postNotice} className="p-5 flex flex-col gap-4 bg-slate-50/50 flex-1 rounded-b-[1.5rem]">
              <div className="space-y-1.5 shrink-0">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(categories).map(cat => {
                    const CatIcon = categories[cat].icon;
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`py-2 px-1 rounded-xl text-[9px] font-bold border transition-all flex flex-col items-center gap-1
                          ${selectedCategory === cat ? `${categories[cat].bg} ${categories[cat].border} ${categories[cat].color} shadow-sm ring-1 ring-${categories[cat].border}` : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        <CatIcon size={14} />
                        {cat.split(' ')[0]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* The text area now flexes to fill all remaining vertical space */}
              <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Message</label>
                <textarea 
                  className="w-full flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#FFB100] focus:border-transparent transition-all resize-none custom-scrollbar"
                  placeholder={`Draft official update as ${userPosition}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="w-full shrink-0 bg-[#1B264F] text-white py-3 rounded-xl font-black text-[11px] flex items-center justify-center gap-2 hover:bg-[#FFB100] hover:text-[#1B264F] transition-colors shadow-md mt-auto"
              >
                <Send size={14}/> Post Notice
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-100 rounded-[1.5rem] p-6 text-center border border-slate-200 flex flex-col items-center justify-center h-full opacity-70">
             <ShieldCheck size={32} className="text-slate-400 mb-2"/>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Read-Only View</p>
             <p className="text-[10px] text-slate-400 mt-1">Only the Core Committee can broadcast.</p>
          </div>
        )}
      </div>

      {/* ================= RIGHT: THE FEED ================= */}
      <div className="w-full lg:w-2/3 bg-white rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
        
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><Clock size={16}/></div>
            <div>
              <h3 className="text-xs font-black text-[#1B264F] uppercase tracking-widest">Live Announcements</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{notices.length} Total Records</p>
            </div>
          </div>
          
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-2 text-slate-400"/>
            <input 
              type="text" 
              placeholder="Search announcements..." 
              className="w-full bg-white border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-[10px] font-medium outline-none focus:border-[#1B264F] transition-all shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
          {filteredNotices.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center">
              <Megaphone size={40} className="mb-3 text-slate-200" />
              <p className="text-sm text-slate-400 font-bold">No announcements found.</p>
            </div>
          ) : (
            filteredNotices.map(n => {
              const catConf = categories[n.category] || categories["General Info"];
              const CatIcon = catConf.icon;

              return (
                <div key={n.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative group flex flex-col gap-3">
                  
                  <div className="flex justify-between items-start">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${catConf.bg} ${catConf.border}`}>
                      <CatIcon size={12} className={catConf.color}/>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${catConf.color}`}>{n.category || "General Info"}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                        {n.timestamp?.toDate().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      
                      {canPost && editingId !== n.id && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button onClick={() => { setEditingId(n.id); setEditText(n.text); }} className="p-1 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded transition"><Edit3 size={12}/></button>
                          <button onClick={() => handleDelete(n.id, n.text)} className="p-1 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded transition"><Trash2 size={12}/></button>
                        </div>
                      )}
                    </div>
                  </div>

                  {editingId === n.id ? (
                    <div className="flex flex-col gap-2 animate-in fade-in">
                      <textarea 
                        className="w-full p-3 bg-slate-50 border border-blue-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#FFB100] transition-all resize-none"
                        rows="3" value={editText} onChange={(e) => setEditText(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-[9px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg uppercase"><X size={12} className="inline mr-1"/> Cancel</button>
                        <button onClick={() => handleSaveEdit(n.id)} className="px-3 py-1.5 text-[9px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg uppercase shadow-md"><Check size={12} className="inline mr-1"/> Save</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-800 leading-relaxed font-medium pl-1">{n.text}</p>
                  )}

                  <div className="pt-3 border-t border-slate-50 flex items-center gap-1.5">
                     <ShieldCheck size={14} className="text-[#FFB100]"/>
                     <span className="text-[10px] font-black text-[#1B264F] uppercase tracking-widest">{n.author}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default NoticeBoard;