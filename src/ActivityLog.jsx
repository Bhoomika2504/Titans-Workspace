import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { History, User, Clock, ShieldCheck } from 'lucide-react';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
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
                    {log.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <ShieldCheck size={12} className="text-emerald-500"/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;