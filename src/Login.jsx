import React, { useState } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        // 1. Create User in Auth
        const res = await createUserWithEmailAndPassword(auth, email, password);
        // 2. Save Name and Role to Firestore
        await setDoc(doc(db, "users", res.user.uid), {
          uid: res.user.uid,
          name: fullName,
          email: email,
          role: email.includes('president') ? 'admin' : 'member'
        });
        alert("Account Created Successfully!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-blue-600">
        <h2 className="text-3xl font-bold text-blue-900 mb-2">TITANS Portal</h2>
        <p className="text-gray-500 mb-6 font-medium uppercase tracking-widest text-xs">
          {isRegistering ? 'Create Member Account' : 'Committee Login'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <input 
              type="text" 
              placeholder="Full Name (e.g. Imdad Bagwan)" 
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}
          <input 
            type="email" 
            placeholder="Position Email" 
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition-transform active:scale-95">
            {isRegistering ? 'Register Member' : 'Authenticate'}
          </button>
        </form>

        <button 
          onClick={() => setIsRegistering(!isRegistering)}
          className="mt-6 text-blue-600 text-sm font-semibold hover:underline w-full"
        >
          {isRegistering ? 'Already have an account? Login' : 'Need to register a new member?'}
        </button>
      </div>
    </div>
  );
};

export default Login;