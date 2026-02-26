import React from 'react';
import { Bell } from 'lucide-react';

const SmallCalendarReminder = () => {
  // Static placeholder for now - will connect to your EventCalendar collection
  const upcoming = [
    { title: "Technical Workshop", date: "March 5" },
    { title: "TITANS Meetup", date: "March 12" }
  ];

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
      <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
        <Bell size={16} className="text-yellow-500"/> Upcoming Reminders
      </h4>
      <div className="space-y-2">
        {upcoming.map((ev, i) => (
          <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
            <span className="text-xs font-medium text-slate-700">{ev.title}</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{ev.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmallCalendarReminder;