import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { History, User, Clock, ShieldCheck, Eye } from 'lucide-react';
import { useAuth } from './context/AuthContext'; 

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const { viewModeArchive } = useAuth(); // <-- Time Machine State

  useEffect(() => {
    // --- TIME MACHINE INTERCEPTOR ---
    if (viewModeArchive) {
      const archivedLogs = viewModeArchive.activity_logs || [];
      const sorted = [...archivedLogs].sort((a, b) => {
        const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
        const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
        return timeB - timeA;
      });
      setLogs(sorted);
      return;
    }

    // --- NORMAL LIVE MODE ---
    const q = query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [viewModeArchive]);

  // Safe time formatter for session storage data
  const formatTime = (ts) => {
    if (!ts) return "";
    try {
      if (ts.toDate) return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return "Time Unknown";
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      
      {/* Archive Warning Banner */}
      {viewModeArchive && (
        <div className="bg-emerald-50 text-emerald-800 p-3 text-center text-xs font-bold uppercase tracking-widest rounded-2xl border-2 border-emerald-500 shadow-sm flex justify-center items-center gap-2 animate-in slide-in-from-top-4">
          <Eye size={16} className="text-emerald-600" /> Viewing Historical Activity for {viewModeArchive.id}
        </div>
      )}

      <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-[#1B264F] p-2 rounded-lg text-white">
              <History size={16}/>
            </div>
            <h3 className="text-lg font-bold text-[#1B264F]">System Activity Logs</h3>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {logs.length} Recent Events
          </span>
        </div>

        <div className="divide-y divide-slate-50">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                  <User size={14}/>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">{log.userName}</p>
                    <span className="bg-[#FFB100]/10 text-[#FFB100] text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border border-[#FFB100]/20">
                      {log.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    <span className="text-blue-600 font-bold">{log.action}:</span> {log.details}
                  </p>
                </div>
              </div>
              
              <div className="text-right flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock size={12}/>
                  <span className="text-[10px] font-bold uppercase tracking-tight">
                    {formatTime(log.timestamp)}
                  </span>
                </div>
                <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <ShieldCheck size={12} className="text-emerald-500"/>
                </div>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
             <div className="p-10 text-center text-slate-400 font-bold text-sm">No activity logs found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;