import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [viewModeArchive, setViewModeArchive] = useState(() => {
    const saved = sessionStorage.getItem('titans_archive_view');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (viewModeArchive) {
      sessionStorage.setItem('titans_archive_view', JSON.stringify(viewModeArchive));
    } else {
      sessionStorage.removeItem('titans_archive_view');
    }
  }, [viewModeArchive]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      try {
        if (currentUser) {
          const userDoc = await getDoc(doc(db, "users", currentUser.email));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setRole(data.role);
            setUser(currentUser);
          } else {
            // Logged in but not in TITANS database
            setUser(null);
            setRole(null);
            setUserData(null);
          }
        } else {
          setUser(null);
          setRole(null);
          setUserData(null);
        }
      } catch (error) {
        console.error("Critical Auth Error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, userData, loading, viewModeArchive, setViewModeArchive }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};