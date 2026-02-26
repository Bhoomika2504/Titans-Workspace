import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, query, where, serverTimestamp, updateDoc, doc, getDocs } from 'firebase/firestore';
import { logActivity } from './utils/logger';
import { 
  Plus, Users, Calendar, Clock, AlignLeft, ShieldCheck, 
  Send, CheckCircle2, Edit3, MessageSquare, RotateCcw, X, 
  ChevronRight, ChevronLeft, Bell, Info
} from 'lucide-react';

const Jovial = ({ userRole, userName = "Bhoomika Wandhekar" }) => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  
  // Modal & Form States
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [viewingTask, setViewingTask] = useState(null); 
  const [updateText, setUpdateText] = useState("");

  const [eventForm, setEventForm] = useState({ title: '', date: '', category: 'Technical', eventIncharge: '', description: '' });
  const [taskForm, setTaskForm] = useState({ taskName: '', assignedTo: '', startDate: '', endDate: '', teamUpWith: '', description: '' });

  const categoryColors = { "None": "#1B264F", "Coding Club": "#3B82F6", "Art Club": "#EC4899", "Technical": "#F97316", "Cultural": "#10B981", "Sports": "#06B6D4" };
  const statuses = ['todo', 'progress', 'review', 'completed'];

  // Access Helpers
  const isPresident = userName === "Bhoomika Wandhekar";
  const isVP = userName === "Imdad Bagwan";
  const isLeadership = isPresident || isVP;

  useEffect(() => {
    const unsubEvents = onSnapshot(collection(db, "events"), (snap) => {
      const evs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEvents(evs);
      if (evs.length > 0 && !selectedEventId) setSelectedEventId(evs[0].id);
    });

    const loadMembers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        setCommitteeMembers(snap.docs.map(d => d.data().name));
      } catch (err) { console.error(err); }
    };
    
    loadMembers();
    return () => unsubEvents();
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) return;
    const q = query(collection(db, "jovial_tasks"), where("eventId", "==", selectedEventId));
    const unsubTasks = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => console.error("Task fetch error:", error));
    
    return () => unsubTasks();
  }, [selectedEventId]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const finalEvent = { ...eventForm, color: categoryColors[eventForm.category], createdAt: serverTimestamp() };
    await addDoc(collection(db, "events"), finalEvent);
    setShowEventModal(false);
    setEventForm({ title: '', date: '', category: 'Technical', eventIncharge: '', description: '' });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const newTask = { 
      ...taskForm, 
      eventId: selectedEventId, 
      status: 'todo', 
      updates: [], 
      createdAt: serverTimestamp() 
    };
    await addDoc(collection(db, "jovial_tasks"), newTask);
    setShowTaskModal(false);
    setTaskForm({ taskName: '', assignedTo: '', startDate: '', endDate: '', teamUpWith: '', description: '' });
  };

  const moveTask = async (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    const isAssigned = task.assignedTo === userName || task.teamUpWith?.includes(userName);
    
    // Only leadership or assigned members can move tasks
    if (!isLeadership && !isAssigned) {
      alert("Only assigned members or leadership can move this task.");
      return;
    }

    await updateDoc(doc(db, "jovial_tasks", taskId), { status: newStatus });
  };

  const addUpdate = async () => {
    if (!updateText.trim() || !viewingTask) return;
    const updates = [...(viewingTask.updates || [])];
    updates.push({ text: updateText, addedBy: userName, time: new Date().toLocaleTimeString() });
    
    await updateDoc(doc(db, "jovial_tasks", viewingTask.id), { updates });
    setUpdateText("");
    setViewingTask(null); // Close modal after update
  };

  const notifyLeadership = async (task) => {
    const currentEvent = events.find(e => e.id === selectedEventId);
    const recipients = new Set(["Bhoomika Wandhekar", "Imdad Bagwan"]); 
    if (currentEvent?.eventIncharge) recipients.add(currentEvent.eventIncharge);

    recipients.forEach(async (recipient) => {
      await addDoc(collection(db, "jovial_notifications"), {
        to: recipient,
        from: userName,
        message: `Task Completed: ${task.taskName} (Event: ${currentEvent?.title})`,
        timestamp: serverTimestamp(),
        read: false
      });
    });
    alert("Leadership notified.");
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto antialiased">
      {/* HEADER */}
      <header className="flex justify-between items-center bg-white p-3 px-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selected Event</span>
          <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="bg-transparent text-sm font-bold text-[#1B264F] outline-none cursor-pointer">
            {events.length > 0 ? events.map(e => <option key={e.id} value={e.id}>{e.title}</option>) : <option>No Events Found</option>}
          </select>
        </div>
        <div className="flex gap-2">
          {isLeadership && (
            <button onClick={() => setShowEventModal(true)} className="bg-slate-100 text-[#1B264F] px-4 py-2 rounded-xl font-bold text-[10px] uppercase shadow-sm flex items-center gap-1.5 hover:bg-slate-200 transition">
              <Calendar size={14}/> New Event
            </button>
          )}
          {isLeadership && (
            <button onClick={() => setShowTaskModal(true)} className="bg-[#1B264F] text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase shadow-lg flex items-center gap-1.5 hover:bg-slate-800 transition">
              <Plus size={14}/> Add Task
            </button>
          )}
        </div>
      </header>

      {/* KANBAN BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {statuses.map(col => (
          <div key={col} className="bg-slate-100/50 p-3 rounded-[1.5rem] min-h-[600px] border border-slate-200/50 min-w-[280px]">
            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 px-2 tracking-widest flex justify-between">
              {col} <span>{tasks.filter(t => t.status === col).length}</span>
            </h4>
            <div className="space-y-3">
              {tasks.filter(t => t.status === col).map(task => {
                const isAssigned = task.assignedTo === userName || task.teamUpWith?.includes(userName);
                return (
                  <div key={task.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 group relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{task.assignedTo || "Unassigned"}</span>
                      <button onClick={() => setViewingTask(task)} className="text-slate-300 hover:text-blue-500"><Info size={14}/></button>
                    </div>
                    <h5 className="text-xs font-bold text-[#1B264F] mb-1">{task.taskName}</h5>
                    
                    {/* RESTORED: Task Description Display */}
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                    
                    <div className="flex justify-between mt-4 border-t border-slate-50 pt-3">
                      <button disabled={col === 'todo'} onClick={() => moveTask(task.id, statuses[statuses.indexOf(col)-1])} className="p-1 hover:bg-slate-100 rounded disabled:opacity-10"><ChevronLeft size={14}/></button>
                      <button disabled={col === 'completed'} onClick={() => moveTask(task.id, statuses[statuses.indexOf(col)+1])} className="p-1 hover:bg-slate-100 rounded disabled:opacity-10"><ChevronRight size={14}/></button>
                    </div>

                    {col === 'completed' && isAssigned && (
                      <button onClick={() => notifyLeadership(task)} className="w-full mt-3 bg-[#FFB100] text-[#1B264F] text-[9px] font-black py-1.5 rounded-lg flex items-center justify-center gap-2 hover:bg-[#ffba1a] transition"><Bell size={12}/> Notify Leadership</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* TASK INFO & UPDATE MODAL */}
      {viewingTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border-t-[8px] border-blue-600">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-[#1B264F] uppercase tracking-tighter">Task Details</h3>
              <button onClick={() => setViewingTask(null)} className="text-slate-400 hover:text-slate-600 transition"><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <h4 className="text-sm font-black text-[#1B264F]">{viewingTask.taskName}</h4>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Deadline: {viewingTask.endDate}</p>
                {/* Full description available inside the modal */}
                <p className="text-[11px] text-slate-600 mt-2">{viewingTask.description}</p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update History</p>
                <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                  {viewingTask.updates?.length > 0 ? viewingTask.updates.map((u, i) => (
                    <div key={i} className="text-[9px] bg-blue-50/50 p-2 rounded-lg border-l-2 border-blue-400">
                      <span className="font-bold text-blue-900">{u.addedBy}:</span> {u.text}
                    </div>
                  )) : <p className="text-[10px] italic text-slate-400">No updates yet.</p>}
                </div>
              </div>

              {/* Only assigned members can see the input */}
              {(viewingTask.assignedTo === userName || viewingTask.teamUpWith?.includes(userName)) ? (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Write Update</p>
                  <div className="flex gap-2">
                    <input className="flex-1 text-[11px] p-3 bg-slate-50 border rounded-xl outline-none" placeholder="What progress have you made?" value={updateText} onChange={(e) => setUpdateText(e.target.value)} />
                    <button onClick={addUpdate} className="p-3 bg-[#1B264F] text-white rounded-xl hover:bg-slate-800 transition"><CheckCircle2 size={18}/></button>
                  </div>
                </div>
              ) : (
                <p className="text-[9px] text-slate-400 italic text-center pt-4 border-t">Viewing as Leadership - Updates are read-only.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EVENT CREATION MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl border-t-[8px] border-[#1B264F]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-[#1B264F] uppercase tracking-tighter">New Event Sync</h3>
              <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-slate-600 transition"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <input placeholder="Event Name" required className="w-full p-3 text-xs bg-slate-50 border rounded-xl outline-none" onChange={e => setEventForm({...eventForm, title: e.target.value})}/>
              <select className="w-full p-3 text-xs bg-slate-50 border rounded-xl outline-none" value={eventForm.category} onChange={e => setEventForm({...eventForm, category: e.target.value})}>
                {Object.keys(categoryColors).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input type="date" required className="w-full p-3 text-xs bg-slate-50 border rounded-xl outline-none" onChange={e => setEventForm({...eventForm, date: e.target.value})}/>
              <input placeholder="Event Incharge" className="w-full p-3 text-xs bg-slate-50 border rounded-xl outline-none" onChange={e => setEventForm({...eventForm, eventIncharge: e.target.value})}/>
              
              {/* RESTORED: Event Description Input */}
              <textarea placeholder="Event Description..." rows="2" className="w-full p-3 text-xs bg-slate-50 border rounded-xl outline-none" onChange={e => setEventForm({...eventForm, description: e.target.value})}></textarea>
              
              <button className="w-full bg-[#1B264F] text-white font-black py-3 rounded-xl text-[10px] uppercase shadow-lg hover:bg-slate-800 transition">Sync with Calendar</button>
              <button type="button" onClick={() => setShowEventModal(false)} className="w-full py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* TASK CREATION MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border-t-[8px] border-blue-600">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-[#1B264F] uppercase tracking-tighter">Assign Task</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-600 transition"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <input placeholder="Task Name" required className="w-full p-3 text-xs bg-slate-50 border rounded-xl outline-none" onChange={e => setTaskForm({...taskForm, taskName: e.target.value})}/>
              
              <div className="relative">
                <select className="w-full p-3 text-xs bg-slate-50 border rounded-xl outline-none appearance-none" onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}>
                  <option value="">@Assign Member</option>
                  {committeeMembers.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input type="date" required className="w-full p-3 text-xs bg-slate-50 border rounded-xl" onChange={e => setTaskForm({...taskForm, startDate: e.target.value})}/>
                <input type="date" required className="w-full p-3 text-xs bg-slate-50 border rounded-xl" onChange={e => setTaskForm({...taskForm, endDate: e.target.value})}/>
              </div>
              
              <input placeholder="Collaborators (Team up with)" className="w-full p-3 text-xs bg-slate-50 border rounded-xl" onChange={e => setTaskForm({...taskForm, teamUpWith: e.target.value})}/>
              
              {/* RESTORED: Task Description Input */}
              <textarea placeholder="Description..." rows="2" className="w-full p-3 text-xs bg-slate-50 border rounded-xl outline-none" onChange={e => setTaskForm({...taskForm, description: e.target.value})}></textarea>
              
              <button className="w-full bg-blue-600 text-white font-black py-3 rounded-xl text-[10px] uppercase shadow-lg hover:bg-blue-700 transition">Confirm Sync</button>
              <button type="button" onClick={() => setShowTaskModal(false)} className="w-full py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Discard</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jovial;