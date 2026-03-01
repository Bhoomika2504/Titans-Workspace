import React, { useState, useEffect, useMemo } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { Users, ShieldAlert, ShieldCheck, Search, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.position.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Step 1: Open modal instead of executing immediately
  const initiateToggle = (user) => {
    setPendingUser(user);
    setIsModalOpen(true);
  };

  // Step 2: Final execution after user confirms
  const handleConfirmAction = async () => {
    if (!pendingUser) return;
    
    const newStatus = pendingUser.status === 'blocked' ? 'active' : 'blocked';
    const actionText = newStatus === 'blocked' ? "blocked" : "activated";
    
    try {
      await updateDoc(doc(db, "users", pendingUser.id), { status: newStatus });
      toast.success(`${pendingUser.name} has been ${actionText}!`, {
        style: { borderRadius: '10px', background: '#1B264F', color: '#fff' }
      });
    } catch (error) {
      toast.error("Update failed. Check permissions.");
    } finally {
      setIsModalOpen(false);
      setPendingUser(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6 relative">
      
      {/* --- CONFIRMATION MODAL OVERLAY --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                <AlertTriangle size={24} />
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Status Change</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to {pendingUser?.status === 'blocked' ? 'activate' : 'block'}{' '}
              <span className="font-bold text-slate-800">{pendingUser?.name}</span>? 
              {pendingUser?.status !== 'blocked' && " They will lose workspace access immediately."}
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmAction}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${
                  pendingUser?.status === 'blocked' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Yes, {pendingUser?.status === 'blocked' ? 'Activate' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h3 className="text-lg font-bold text-[#1B264F] flex items-center gap-2">
          <Users size={20}/> Member Access Management
        </h3>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search name or role..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-slate-400 uppercase text-[10px] font-black">
              <th className="pb-3 px-2">Name</th>
              <th className="pb-3 px-2">Position</th>
              <th className="pb-3 px-2">Status</th>
              <th className="pb-3 px-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? filteredUsers.map(u => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                <td className="py-4 px-2 font-semibold text-slate-700">{u.name}</td>
                <td className="py-4 px-2 text-slate-500 uppercase text-[10px] font-bold">{u.position}</td>
                <td className="py-4 px-2">
                  <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${u.status === 'blocked' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {u.status || 'active'}
                  </span>
                </td>
                <td className="py-4 px-2 text-right">
                  <button 
                    onClick={() => initiateToggle(u)}
                    className={`p-2 rounded-lg transition-all ${u.status === 'blocked' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                  >
                    {u.status === 'blocked' ? <ShieldCheck size={16}/> : <ShieldAlert size={16}/>}
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="py-10 text-center text-slate-400 font-bold">No members found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;