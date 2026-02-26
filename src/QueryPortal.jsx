import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, onSnapshot, updateDoc, doc, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './context/AuthContext'; // <-- Global Context
import { MessageCircle, CheckCircle, Clock, Send, Eye, ShieldCheck, Plus, X } from 'lucide-react';

const QueryPortal = () => {
  const [queries, setQueries] = useState([]);
  const [reply, setReply] = useState('');
  const [newQuery, setNewQuery] = useState('');
  const [selectedQuery, setSelectedQuery] = useState(null);

  // --- RBAC & GLOBAL STATE ---
  const { userData, role, viewModeArchive } = useAuth();
  const isPresident = role === 'admin';
  const userName = userData?.name || "Unknown User";
  const userEmail = userData?.email || "Unknown Email";

  // Helper to sort timestamps safely (handles both Firebase and Archive string formats)
  const sortByTime = (a, b) => {
    const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp || 0).getTime();
    const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp || 0).getTime();
    return timeB - timeA;
  };

  useEffect(() => {
    // --- TIME MACHINE INTERCEPTOR ---
    if (viewModeArchive) {
      let archivedQueries = viewModeArchive.queries || [];
      // If not the President, only show their own archived queries
      if (!isPresident) {
        archivedQueries = archivedQueries.filter(q => q.senderEmail === userEmail);
      }
      setQueries([...archivedQueries].sort(sortByTime));
      return;
    }

    // --- NORMAL LIVE MODE ---
    const q = query(collection(db, "queries"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedQueries = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Client-side filter for members so they only see their own private queries
      if (!isPresident) {
        fetchedQueries = fetchedQueries.filter(q => q.senderEmail === userEmail);
      }
      setQueries(fetchedQueries);
    });

    return () => unsubscribe();
  }, [viewModeArchive, isPresident, userEmail]);

  // ACTION: President replies to a query
  const handleReply = async (id) => {
    if (!reply.trim() || viewModeArchive || !isPresident) return;
    
    await updateDoc(doc(db, "queries", id), {
      answer: reply,
      status: 'resolved',
      answeredBy: userName,
      answeredAt: serverTimestamp()
    });
    
    setReply('');
    // Update the local selected query state so it shows the answer instantly
    setSelectedQuery(prev => ({ ...prev, answer: reply, status: 'resolved' }));
  };

  // ACTION: Member asks a new question
  const handleAsk = async (e) => {
    e.preventDefault();
    if (!newQuery.trim() || viewModeArchive || isPresident) return;

    await addDoc(collection(db, "queries"), {
      text: newQuery,
      sender: userName,
      senderEmail: userEmail,
      status: 'pending',
      timestamp: serverTimestamp()
    });
    
    setNewQuery('');
    setSelectedQuery(null); // Go back to default view after asking
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto antialiased">
      
      {/* Archive Warning Banner */}
      {viewModeArchive && (
        <div className="bg-emerald-50 text-emerald-800 p-3 text-center text-xs font-bold uppercase tracking-widest rounded-2xl border-2 border-emerald-500 shadow-sm flex justify-center items-center gap-2 animate-in slide-in-from-top-4">
          <Eye size={16} className="text-emerald-600" /> Viewing Historical Queries for {viewModeArchive.id}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-160px)] min-h-[500px]">
        
        {/* ================= LEFT: INBOX LIST ================= */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden flex flex-col shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="bg-[#1B264F] p-2 rounded-lg text-white">
                <MessageCircle size={16}/>
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1B264F] uppercase tracking-widest">
                  {isPresident ? 'Incoming Queries' : 'My Queries'}
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{queries.length} Total</p>
              </div>
            </div>
            
            {/* "Ask President" Button for Members */}
            {!isPresident && !viewModeArchive && (
              <button 
                onClick={() => setSelectedQuery('NEW')}
                className="bg-[#FFB100] text-[#1B264F] p-2 rounded-xl hover:bg-yellow-400 transition shadow-sm"
                title="Ask a Question"
              >
                <Plus size={16}/>
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {queries.length === 0 ? (
               <div className="text-center p-10 text-slate-400 text-xs italic">
                 {isPresident ? "No incoming questions." : "You haven't asked any questions yet."}
               </div>
            ) : (
              queries.map(q => {
                const isSelected = selectedQuery?.id === q.id;
                return (
                  <div 
                    key={q.id} 
                    onClick={() => setSelectedQuery(q)}
                    className={`p-4 border-b border-slate-50 cursor-pointer transition-all ${isSelected ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase text-[#1B264F]">{isPresident ? q.sender : 'To: President'}</span>
                      {q.status === 'resolved' 
                        ? <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded"><CheckCircle size={10}/> RESOLVED</span> 
                        : <span className="flex items-center gap-1 text-[8px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded"><Clock size={10}/> PENDING</span>
                      }
                    </div>
                    <p className={`text-xs ${isSelected ? 'text-blue-900 font-medium' : 'text-slate-600'} truncate`}>{q.text}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT: CHAT / COMPOSE AREA ================= */}
        <div className="md:col-span-2 bg-white rounded-[1.5rem] border border-slate-200 flex flex-col shadow-sm overflow-hidden">
          
          {/* STATE 1: MEMBER COMPOSING A NEW QUESTION */}
          {selectedQuery === 'NEW' && !isPresident ? (
            <div className="flex flex-col h-full animate-in fade-in">
              <div className="p-6 border-b border-slate-100 bg-[#1B264F] text-white flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black tracking-tighter">Direct Line to President</h3>
                  <p className="text-[10px] text-[#FFB100] uppercase tracking-widest mt-1">Private & Confidential</p>
                </div>
                <button onClick={() => setSelectedQuery(null)} className="text-white/50 hover:text-white transition"><X size={20}/></button>
              </div>
              <form onSubmit={handleAsk} className="p-6 flex-1 flex flex-col">
                <textarea 
                  className="w-full flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#FFB100] resize-none"
                  placeholder="Type your question or concern here..."
                  value={newQuery}
                  onChange={(e) => setNewQuery(e.target.value)}
                  autoFocus
                />
                <div className="mt-4 flex justify-end">
                  <button type="submit" className="bg-[#1B264F] text-white font-black text-[11px] uppercase tracking-widest py-3 px-8 rounded-xl hover:bg-[#FFB100] hover:text-[#1B264F] transition shadow-md flex items-center gap-2">
                    <Send size={14}/> Submit Query
                  </button>
                </div>
              </form>
            </div>

          /* STATE 2: VIEWING AN EXISTING QUESTION (BOTH ROLES) */
          ) : selectedQuery ? (
            <div className="flex flex-col h-full animate-in fade-in">
              
              {/* Top Header of the Thread */}
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black uppercase shadow-inner">
                    {selectedQuery.sender.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#1B264F]">{selectedQuery.sender}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{selectedQuery.senderEmail}</p>
                  </div>
                </div>
                {selectedQuery.status === 'resolved' && <ShieldCheck size={24} className="text-emerald-500 opacity-50"/>}
              </div>

              {/* Chat Thread */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                
                {/* The Question Bubble */}
                <div className="flex flex-col items-start">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-2">Question</span>
                  <div className="bg-slate-100 text-slate-800 p-4 rounded-2xl rounded-tl-sm max-w-[85%] text-sm leading-relaxed border border-slate-200 shadow-sm">
                    {selectedQuery.text}
                  </div>
                </div>

                {/* The Answer Bubble (If resolved) */}
                {selectedQuery.answer && (
                  <div className="flex flex-col items-end animate-in slide-in-from-bottom-2">
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1 mr-2">Official Reply</span>
                    <div className="bg-[#1B264F] text-white p-4 rounded-2xl rounded-tr-sm max-w-[85%] text-sm leading-relaxed shadow-md">
                      {selectedQuery.answer}
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Box (ONLY FOR PRESIDENT on PENDING queries) */}
              {isPresident && selectedQuery.status !== 'resolved' && !viewModeArchive && (
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <div className="relative">
                    <textarea 
                      className="w-full p-4 pr-16 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500 resize-none shadow-sm"
                      rows="3"
                      placeholder="Draft official response..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                    />
                    <button 
                      onClick={() => handleReply(selectedQuery.id)}
                      className="absolute right-3 bottom-3 bg-[#FFB100] text-[#1B264F] p-2.5 rounded-xl hover:bg-yellow-400 transition shadow-sm disabled:opacity-50"
                      disabled={!reply.trim()}
                    >
                      <Send size={16} className="ml-0.5"/>
                    </button>
                  </div>
                </div>
              )}
            </div>

          /* STATE 3: EMPTY DESK (NOTHING SELECTED) */
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-60">
              <MessageCircle size={48} className="text-slate-300 mb-4"/>
              <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">Query Portal</h3>
              <p className="text-xs font-bold text-slate-400 mt-2">
                {isPresident 
                  ? "Select a query from the inbox to review and officially resolve it."
                  : "Select an existing query to view the status, or ask a new question."}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default QueryPortal;