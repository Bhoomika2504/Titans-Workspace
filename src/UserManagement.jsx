import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { Users, ShieldAlert, ShieldCheck } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    return onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const toggleBlock = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    await updateDoc(doc(db, "users", userId), { status: newStatus });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 mt-6">
      <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
        <Users size={20}/> Member Access Management
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="pb-2">Name</th>
              <th className="pb-2">Position</th>
              <th className="pb-2">Status</th>
              <th className="pb-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="py-3 font-medium">{u.name}</td>
                <td className="py-3 text-slate-500 uppercase text-[10px] font-bold">{u.position}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${u.status === 'blocked' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {u.status || 'active'}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <button 
                    onClick={() => toggleBlock(u.id, u.status)}
                    className={`p-2 rounded-lg transition-colors ${u.status === 'blocked' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                  >
                    {u.status === 'blocked' ? <ShieldCheck size={16}/> : <ShieldAlert size={16}/>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;