import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, onSnapshot, updateDoc, doc, orderBy } from 'firebase/firestore';
import { MessageCircle, CheckCircle, Clock } from 'lucide-react';

const QueryPortal = () => {
  const [queries, setQueries] = useState([]);
  const [reply, setReply] = useState('');
  const [selectedQuery, setSelectedQuery] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "queries"), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
      setQueries(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleReply = async (id) => {
    await updateDoc(doc(db, "queries", id), {
      answer: reply,
      status: 'resolved',
      answeredBy: 'President'
    });
    setReply('');
    setSelectedQuery(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
      {/* Inbox List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-y-auto">
        <div className="p-4 border-b font-bold text-slate-700 flex items-center gap-2">
          <MessageCircle size={18}/> Incoming Queries
        </div>
        {queries.map(q => (
          <div 
            key={q.id} 
            onClick={() => setSelectedQuery(q)}
            className={`p-4 border-b cursor-pointer transition ${selectedQuery?.id === q.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-slate-50'}`}
          >
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600">{q.sender}</span>
              {q.status === 'resolved' ? <CheckCircle size={12} className="text-green-500"/> : <Clock size={12} className="text-orange-500"/>}
            </div>
            <p className="text-xs text-slate-700 truncate">{q.text}</p>
          </div>
        ))}
      </div>

      {/* Chat/Reply Area */}
      <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 flex flex-col">
        {selectedQuery ? (
          <>
            <div className="p-6 flex-1">
              <div className="mb-6">
                <span className="text-xs text-slate-400">Question:</span>
                <p className="text-lg font-medium text-slate-800 mt-1">{selectedQuery.text}</p>
              </div>
              {selectedQuery.answer && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <span className="text-[10px] font-bold text-green-600 uppercase">Your Answer:</span>
                  <p className="text-sm text-green-800">{selectedQuery.answer}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-slate-50">
              <textarea 
                className="w-full p-3 border rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your official response..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <button 
                onClick={() => handleReply(selectedQuery.id)}
                className="mt-2 w-full bg-blue-600 text-white font-bold py-2 rounded-lg"
              >
                Send Official Reply
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Select a query to view and reply</div>
        )}
      </div>
    </div>
  );
};

export default QueryPortal;