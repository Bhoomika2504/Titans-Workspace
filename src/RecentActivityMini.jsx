import React from 'react';
import { History } from 'lucide-react';

const RecentActivityMini = () => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
      <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
        <History size={16} className="text-slate-400"/> Recent Logs
      </h4>
      <div className="text-[11px] space-y-3 text-slate-500">
        <p><span className="font-bold text-slate-700">Imdad B.</span> updated Jovial Status</p>
        <p><span className="font-bold text-slate-700">Shivam B.</span> posted a new Notice</p>
        <p><span className="font-bold text-slate-700">System</span> backup completed</p>
      </div>
    </div>
  );
};

export default RecentActivityMini;