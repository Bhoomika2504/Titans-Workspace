import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

// to bulk upload team members to Firestore, run this component once and then comment it out again. 
/*
import React from 'react';
import UploadTeam from './UploadTeam'; 

function App() {
  return (
    <div className="min-h-screen bg-slate-100 p-10">
      <UploadTeam />
    </div>
  );
}

export default App;

*/