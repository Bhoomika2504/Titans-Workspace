import React, { useState, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import { auth } from './firebase';
import { Layout, Calendar, Shield, Users, History, MessageSquare, LogOut, Grid } from 'lucide-react';

// Lazy load views for the TITANS Workspace
const Home = React.lazy(() => import('./Home')); // Added Home import
const NoticeBoard = React.lazy(() => import('./NoticeBoard'));
const Jovial = React.lazy(() => import('./Jovial'));
const EventCalendar = React.lazy(() => import('./EventCalendar'));
const TeamHierarchy = React.lazy(() => import('./TeamHierarchy'));
const ActivityLog = React.lazy(() => import('./ActivityLog'));
const QueryPortal = React.lazy(() => import('./QueryPortal'));

const Dashboard = () => {
  const { role, userData, loading } = useAuth();
  const [activeView, setActiveView] = useState('home');

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#1B264F] text-white font-bold">
      Initializing TITANS Portal...
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F4F7FA] text-[#1B264F] font-sans antialiased overflow-hidden">
      
      {/* SIDEBAR - Thinner (w-64) for high density */}
      <nav className="w-64 bg-[#1B264F] text-white p-5 flex flex-col shadow-2xl fixed h-full z-30">
        <div className="mb-8 flex items-center h-12 gap-2 -ml-3">
          <div className="flex-shrink-0">
            <img src="/Titans Logo.png" alt="Titans Logo" className="h-18 w-auto p-0 object-contain" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white leading-none">TITANS</h1>
        </div>
        
        <div className="space-y-1 flex-1">
          {/* Added Home Overview Button */}
          <NavBtn label="Home Overview" icon={<Grid size={16}/>} active={activeView === 'home'} onClick={() => setActiveView('home')} />
          <NavBtn label="Notice Board" icon={<Layout size={16}/>} active={activeView === 'notice'} onClick={() => setActiveView('notice')} />
          <NavBtn label="Event Calendar" icon={<Calendar size={16}/>} active={activeView === 'calendar'} onClick={() => setActiveView('calendar')} />
          <NavBtn label="Jovial Workspace" icon={<Shield size={16}/>} active={activeView === 'jovial'} onClick={() => setActiveView('jovial')} />
          <NavBtn label="My Team" icon={<Users size={16}/>} active={activeView === 'team'} onClick={() => setActiveView('team')} />
          {role === 'admin' && <NavBtn label="Activity Logs" icon={<History size={16}/>} active={activeView === 'activity'} onClick={() => setActiveView('activity')} />}
        </div>

        {/* Queries Shortcut */}
        <div className="pt-3 border-t border-white/10 mt-3">
          <button 
            onClick={() => setActiveView('queries')} 
            className={`w-full flex items-center justify-between p-2.5 rounded-lg font-bold text-xs transition-all ${activeView === 'queries' ? 'bg-white/20 text-white' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={16} className="text-[#FFB100]"/>
              <span>Queries</span>
            </div>
            <span className="bg-red-500 text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">New</span>
          </button>
        </div>

        <button onClick={() => auth.signOut()} className="mt-6 flex items-center gap-2 text-slate-400 hover:text-white transition group px-2">
          <LogOut size={16} className="group-hover:translate-x-1 transition-transform"/> 
          <span className="font-bold text-xs">Logout</span>
        </button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 h-screen overflow-y-auto">
        <header className="px-6 py-2.5 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-20 shadow-sm min-h-[80px]">
          <div className="flex flex-col justify-center">
            <h2 className="text-xl font-bold text-slate-800 leading-tight">Welcome, {userData?.name || "Bhoomika Wandhekar"}</h2>
            <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mt-0.5">{userData?.position || "President"} | ADMIN</p>
          </div>
          <div className="flex-shrink-0 flex items-center h-14">
            <img src="/Untitled37.jpg" alt="Trinity College" className="h-14 w-auto p-0 shadow-none rounded-none object-contain" />
          </div>
        </header>

        <div className="p-6 max-w-[1600px] mx-auto">
          <Suspense fallback={<div className="text-center p-20 font-bold text-slate-400">Loading Module...</div>}>
            
            {/* 🚀 Replaced Hardcoded layout with your new Home.jsx */}
            {activeView === 'home' && <Home userName={userData?.name || "Bhoomika Wandhekar"} userRole={role} />}
            
            {/* Added dedicated Notice Board view */}
            {activeView === 'notice' && (
              <div className="h-full">
                <NoticeBoard 
                  userName={userData?.name || "Bhoomika Wandhekar"} 
                  userPosition={userData?.position || "President"} 
                />
              </div>
            )}
            
            {activeView === 'calendar' && <EventCalendar role={role} />}
            {activeView === 'jovial' && <Jovial userRole={role} userName={userData?.name || "Bhoomika Wandhekar"} />}
            {activeView === 'team' && <TeamHierarchy role={role} />}
            {activeView === 'activity' && <ActivityLog />}
            {activeView === 'queries' && <QueryPortal />}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

const NavBtn = ({ label, icon, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-2.5 p-2 rounded-lg font-bold text-xs transition-all ${active ? 'bg-[#FFB100] text-[#1B264F] shadow-lg' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
    {icon} {label}
  </button>
);

export default Dashboard;