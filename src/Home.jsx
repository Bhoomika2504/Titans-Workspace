import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy, limit, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './context/AuthContext'; 
import { 
  Megaphone, CalendarDays, Bell, MessageSquare, History, HelpCircle, 
  Send, Clock, ShieldCheck, Pin, Users, Eye
} from 'lucide-react';

const Home = () => {
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [chats, setChats] = useState([]);
  const [queries, setQueries] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const currentDate = new Date();

  // --- RBAC & GLOBAL STATE ---
  const { userData, role, viewModeArchive } = useAuth(); 
  const userName = userData?.name || "Unknown User";
  const userEmail = userData?.email || "Unknown Email";

  const sortByTime = (a, b) => {
    const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp || 0).getTime();
    const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp || 0).getTime();
    return timeB - timeA; 
  };

  // Mock data for Users Online
  const onlineUsers = [
    { name: "Bhoomika Wandhekar", role: "President" },
    { name: "Imdad Bagwan", role: "Vice President" },
    { name: "Sanir", role: "Technical Head" },
    { name: "Kavhirk", role: "PR Head" }
  ];

  useEffect(() => {
    // --- TIME MACHINE INTERCEPTOR ---
    if (viewModeArchive) {
      setNotices([...(viewModeArchive.notices || [])].sort(sortByTime).slice(0, 4));
      setEvents(viewModeArchive.events || []);
      setLogs([...(viewModeArchive.activity_logs || [])].sort(sortByTime).slice(0, 8));
      
      // RBAC for Archived Queries
      let archivedQueries = viewModeArchive.queries || [];
      if (role !== 'admin') archivedQueries = archivedQueries.filter(q => q.senderEmail === userEmail);
      setQueries([...archivedQueries].sort(sortByTime).slice(0, 4));
      
      setChats([]); 
      setNotifications([]); 
      return;
    }

    // --- NORMAL LIVE MODE ---
    const qNotices = query(collection(db, "notices"), orderBy("timestamp", "desc"), limit(4));
    const unNotices = onSnapshot(qNotices, snap => setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const unEvents = onSnapshot(collection(db, "events"), snap => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qNotifs = query(collection(db, "jovial_notifications"), where("to", "in", [userName, "President"]), orderBy("timestamp", "desc"), limit(6));
    const unNotifs = onSnapshot(qNotifs, snap => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qLogs = query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(8));
    const unLogs = onSnapshot(qLogs, snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qChats = query(collection(db, "chats"), orderBy("timestamp", "desc"), limit(12));
    const unChats = onSnapshot(qChats, snap => setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse()));

    // Queries: Fetch recent, then filter based on role (President sees all, Members see their own)
    const qQueries = query(collection(db, "queries"), orderBy("timestamp", "desc"), limit(20));
    const unQueries = onSnapshot(qQueries, snap => {
      let fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (role !== 'admin') fetched = fetched.filter(q => q.senderEmail === userEmail);
      setQueries(fetched.slice(0, 4));
    });

    return () => { unNotices(); unEvents(); unNotifs(); unLogs(); unChats(); unQueries(); };
  }, [userName, userEmail, role, viewModeArchive]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || viewModeArchive) return;
    await addDoc(collection(db, "chats"), { text: chatInput, sender: userName, timestamp: serverTimestamp() });
    setChatInput("");
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= currentDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  const BentoCard = ({ title, icon: Icon, children, className = "", headerColor = "text-[#1B264F]" }) => (
    <div className={`bg-white rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col overflow-hidden ${className}`}>
      <div className="p-3.5 border-b border-slate-100 flex items-center gap-2 shrink-0 bg-slate-50/50">
        <div className={`p-1.5 rounded-md bg-white shadow-sm border border-slate-100 ${headerColor}`}><Icon size={14} /></div>
        <h3 className={`font-black text-[11px] uppercase tracking-widest ${headerColor}`}>{title}</h3>
      </div>
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );

  const renderDate = (ts) => {
    if (!ts) return "";
    try {
      return ts.toDate ? ts.toDate().toLocaleDateString() : new Date(ts.seconds ? ts.seconds * 1000 : ts).toLocaleDateString();
    } catch { return ""; }
  };
  const renderTime = (ts) => {
    if (!ts) return "";
    try {
      return ts.toDate ? ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(ts.seconds ? ts.seconds * 1000 : ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ""; }
  };

  return (
    <div className="max-w-[1600px] mx-auto antialiased">
      
      {viewModeArchive && (
        <div className="bg-emerald-50 text-emerald-800 p-3 text-center text-xs font-bold uppercase tracking-widest rounded-2xl border-2 border-emerald-500 shadow-sm flex justify-center items-center gap-2 animate-in slide-in-from-top-4 mb-6">
          <Eye size={16} className="text-emerald-600" /> Viewing Historical Dashboard for {viewModeArchive.id}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* ================= ROW 1 ================= */}
        
        <BentoCard title="Notice Board" icon={Megaphone} headerColor="text-blue-600" className="md:col-span-2 h-[260px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {notices.length > 0 ? notices.map(n => (
              <div key={n.id} className="relative bg-gradient-to-br from-blue-50 to-white p-4 rounded-2xl border border-blue-100 shadow-sm group">
                <Pin size={12} className="absolute top-2 right-2 text-blue-400 rotate-45 opacity-50 group-hover:opacity-100" />
                <p className="text-xs text-slate-700 font-bold leading-relaxed line-clamp-3">{n.text}</p>
                <div className="mt-3 flex justify-between items-center border-t border-blue-100/50 pt-2">
                  <span className="text-[9px] font-black text-blue-600 uppercase">{n.author || 'Admin'}</span>
                  <span className="text-[8px] font-bold text-slate-400">{renderDate(n.timestamp)}</span>
                </div>
              </div>
            )) : <p className="text-xs text-slate-400 italic">No recent notices.</p>}
          </div>
        </BentoCard>

        {/* --- DYNAMIC RBAC QUERIES BOX --- */}
        <BentoCard title="Queries" icon={HelpCircle} headerColor="text-orange-500" className="md:col-span-1 h-[260px]">
          <div className="space-y-3">
            {queries.length > 0 ? queries.map(q => {
              const isResolved = q.status === 'resolved';
              return (
                <div key={q.id} className="p-3 border border-orange-100 bg-orange-50/30 rounded-xl hover:bg-orange-50 transition-colors">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black text-slate-800 truncate pr-2">
                      {role === 'admin' ? q.sender : 'To: President'}
                    </span>
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase shadow-sm shrink-0 ${isResolved ? 'bg-emerald-100 text-emerald-700' : 'bg-[#FFB100] text-[#1B264F]'}`}>
                      {isResolved ? 'Resolved' : 'Pending'}
                    </span>
                  </div>
                  
                  {/* If user is a member AND it is resolved, show the President's Reply! */}
                  {role !== 'admin' && isResolved ? (
                    <div className="bg-white p-2 rounded-lg border border-emerald-100 shadow-sm mt-1">
                      <span className="text-[8px] font-black text-emerald-600 uppercase block mb-0.5">President's Reply:</span>
                      <p className="text-[10px] text-slate-600 line-clamp-2">{q.answer}</p>
                    </div>
                  ) : (
                    /* Otherwise show the original question text */
                    <p className="text-[10px] text-slate-600 line-clamp-2">{q.text}</p>
                  )}
                </div>
              );
            }) : <p className="text-[10px] text-slate-400 italic text-center mt-6">Inbox is clear!</p>}
          </div>
        </BentoCard>

        {/* ================= ROW 2 ================= */}

        <BentoCard title="Calendar" icon={CalendarDays} className="md:col-span-1 h-[300px]">
          <h4 className="text-[10px] font-black text-[#1B264F] uppercase tracking-widest mb-3 flex items-center justify-between">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full text-[8px]">TODAY: {currentDate.getDate()}</span>
          </h4>
          <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
            {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-[8px] font-black text-slate-300 uppercase">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`}/>)}
            {[...Array(totalDays)].map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasEvent = events.some(e => e.date === dateStr);
              const isToday = day === currentDate.getDate() && !viewModeArchive;
              return (
                <div key={day} className={`aspect-square flex items-center justify-center text-[10px] rounded-lg font-bold transition-all
                  ${isToday ? 'bg-[#1B264F] text-[#FFB100] shadow-md scale-110' : 
                   hasEvent ? 'bg-[#FFB100]/20 text-[#1B264F] font-black ring-1 ring-[#FFB100]/50' : 
                   'text-slate-500 hover:bg-slate-100 cursor-default'}`}>
                  {day}
                </div>
              );
            })}
          </div>
        </BentoCard>

        <BentoCard title="Event Reminder" icon={Clock} headerColor="text-indigo-600" className="md:col-span-1 h-[300px]">
          <div className="space-y-4">
            {upcomingEvents.length > 0 ? upcomingEvents.map((e) => (
              <div key={e.id} className="relative pl-3 border-l-[3px]" style={{ borderColor: e.color || '#1B264F' }}>
                <p className="text-xs font-black text-[#1B264F] leading-snug">{e.title}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                  {new Date(e.date).toLocaleDateString('default', { month: 'short', day: 'numeric' })} • <span style={{ color: e.color || '#3B82F6' }}>{e.category}</span>
                </p>
                {e.eventIncharge && <p className="text-[8px] text-slate-400 mt-0.5">IC: {e.eventIncharge}</p>}
              </div>
            )) : <p className="text-[10px] text-slate-400 italic">No upcoming events scheduled.</p>}
          </div>
        </BentoCard>

        <BentoCard title="Notifications" icon={Bell} headerColor="text-[#FFB100]" className="md:col-span-1 h-[300px]">
          <div className="space-y-3">
            {notifications.length > 0 ? notifications.map(n => (
              <div key={n.id} className="p-3 bg-yellow-50/40 rounded-xl border border-yellow-100 flex gap-2.5 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFB100] mt-1.5 shrink-0"></div>
                <div>
                  <p className="text-[10px] text-[#1B264F] font-bold leading-snug">{n.message}</p>
                  <p className="text-[7px] font-black text-slate-400 uppercase mt-1">From: {n.from}</p>
                </div>
              </div>
            )) : <p className="text-[10px] text-slate-400 italic text-center mt-8">All caught up!</p>}
          </div>
        </BentoCard>

        {/* ================= ROW 3 ================= */}

        <BentoCard title="Users Online" icon={Users} headerColor="text-teal-600" className="md:col-span-1 h-[300px]">
          <div className="space-y-3">
            {!viewModeArchive ? onlineUsers.map((user, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition">
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[10px] font-black text-slate-600 uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#1B264F] leading-tight">{user.name}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase">{user.role}</p>
                </div>
              </div>
            )) : <p className="text-[10px] text-slate-400 italic text-center mt-6">Presence unavailable in archive.</p>}
          </div>
        </BentoCard>

        <BentoCard title="Group Chat" icon={MessageSquare} headerColor="text-emerald-600" className="md:col-span-2 h-[300px]">
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-3 mb-3 pr-2 flex flex-col justify-end">
              {chats.length > 0 ? chats.map(c => {
                const isMe = c.sender === userName;
                return (
                  <div key={c.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 px-1">{c.sender}</span>
                    <div className={`px-3 py-2 rounded-2xl text-[10px] max-w-[70%] shadow-sm ${isMe ? 'bg-[#1B264F] text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm font-medium'}`}>
                      {c.text}
                    </div>
                  </div>
                );
              }) : <p className="text-[10px] text-slate-400 italic text-center mb-4">Start the conversation...</p>}
            </div>
            
            {!viewModeArchive && (
              <form onSubmit={handleSendChat} className="mt-auto relative pt-2 border-t border-slate-50">
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-[11px] outline-none focus:border-[#1B264F] transition-all"
                  placeholder="Type a message to the committee..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                />
                <button type="submit" className="absolute right-2 top-3.5 text-blue-500 hover:text-[#1B264F] transition-colors p-1">
                  <Send size={14}/>
                </button>
              </form>
            )}
          </div>
        </BentoCard>

        {/* ================= ROW 4 ================= */}

        <BentoCard title="Activity Log" icon={History} className="md:col-span-3 min-h-[220px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {logs.length > 0 ? logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={10}/>
                </div>
                <div>
                  <p className="text-[10px] text-slate-600 font-medium leading-snug">
                    <span className="font-bold text-[#1B264F]">{log.userName}</span> {log.action.toLowerCase()} <span className="font-bold text-slate-800">{log.details}</span>
                  </p>
                  <span className="text-[8px] font-black text-slate-400 uppercase mt-1 block">
                    {renderDate(log.timestamp)} • {renderTime(log.timestamp)}
                  </span>
                </div>
              </div>
            )) : <p className="text-[10px] text-slate-400 italic pl-2">No recent system activity.</p>}
          </div>
        </BentoCard>

      </div>
    </div>
  );
};

export default Home;