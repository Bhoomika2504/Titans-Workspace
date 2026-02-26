import React, { useState } from 'react';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ShieldCheck, UploadCloud } from 'lucide-react';

const UploadTeam = () => {
  const [status, setStatus] = useState("Ready to upload");

  const teamData = [
    // CORE LEAD TEAM
    { email: "president.titans@tcoer.edu.in", name: "Bhoomika Wandhekar", position: "President", year: "BE", role: "admin", hierarchyLevel: 1 },
    { email: "vicepresident.titans@tcoer.edu.in", name: "Imdad Bagwan", position: "Vice President", year: "TE", role: "executive", hierarchyLevel: 2 },
    { email: "secretary.titans@tcoer.edu.in", name: "Shivam Bairagya", position: "Secretary", year: "BE", role: "executive", hierarchyLevel: 3 },
    { email: "treasurer.titans@tcoer.edu.in", name: "Mahadev Swami", position: "Treasurer", year: "TE", role: "member", hierarchyLevel: 4 },
    { email: "associatetreasurer.titans@tcoer.edu.in", name: "Soundarya Patil", position: "Associate Treasurer", year: "TE", role: "member", hierarchyLevel: 5 },
    
    // CULTURAL TEAM
    { email: "culturalsecretary.titans@tcoer.edu.in", name: "Harshada Tavhare", position: "Cultural Secretary", year: "TE", role: "member", hierarchyLevel: 4 },
    { email: "culturalcoordinator.titans@tcoer.edu.in", name: "Aashita Somvanshi", position: "Cultural Coordinator", year: "SE", role: "member", hierarchyLevel: 5 },
    { email: "culturalassociate.titans@tcoer.edu.in", name: "Yugeen Nandgaonkar", position: "Cultural Associate", year: "SE", role: "member", hierarchyLevel: 6 },
    { email: "artcoordinator.titans@tcoer.edu.in", name: "Sakshi Mane", position: "Art Coordinator", year: "TE", role: "member", hierarchyLevel: 5 },
    { email: "eventcoordinator.titans@tcoer.edu.in", name: "Saniya Sande", position: "Event Coordinator", year: "SE", role: "member", hierarchyLevel: 5 },
    { email: "eventassistant.titans@tcoer.edu.in", name: "Sanika Bhogawade", position: "Event Assistant", year: "SE", role: "member", hierarchyLevel: 6 },
    { email: "dancecoordinator.titans@tcoer.edu.in", name: "Sailaxami Pasupuleti", position: "Dance Coordinator", year: "SE", role: "member", hierarchyLevel: 5 },
    
    // SPORT TEAM
    { email: "sportssecretary.titans@tcoer.edu.in", name: "Suyash Hulawale", position: "Sports Secretary", year: "TE", role: "member", hierarchyLevel: 4 },
    { email: "sportscoordinator1.titans@tcoer.edu.in", name: "Shrinivas Adhav", position: "Sports Coordinator", year: "TE", role: "member", hierarchyLevel: 5 },
    { email: "sportscoordinator2.titans@tcoer.edu.in", name: "Jadhav Pooja", position: "Sports Coordinator", year: "TE", role: "member", hierarchyLevel: 5 },
    { email: "sportscoordinator3.titans@tcoer.edu.in", name: "Dhiraj Pardeshi", position: "Sports Coordinator", year: "SE", role: "member", hierarchyLevel: 5 },
    { email: "sportscoordinator4.titans@tcoer.edu.in", name: "Aryan Surwade", position: "Sports Coordinator", year: "SE", role: "member", hierarchyLevel: 5 },
    { email: "sportscoordinator5.titans@tcoer.edu.in", name: "Pawan Jadhav", position: "Sports Coordinator", year:"SE" , role:"member" , hierarchyLevel : 5},
    
    // TECHNICAL TEAM
    { email: "technicalsecretary.titans@tcoer.edu.in", name: "Arsalaan Khan", position: "Technical Secretary", year: "SE", role: "member", hierarchyLevel: 4 },
    { email: "technicalcoordinator.titans@tcoer.edu.in", name: "Adarsh Bhande", position: "Technical Coordinator", year: "SE", role: "member", hierarchyLevel: 5 },
    { email: "developer.titans@tcoer.edu.in", name: "Stavan Shalmon Padale", position: "Developer", year: "SE", role: "member", hierarchyLevel: 6 },
    { email: "technicalassociate.titans@tcoer.edu.in", name: "Ananya Sardar", position: "Technical Associate", year: "SE", role: "member", hierarchyLevel: 6 },
    
    // PR & MARKETING TEAM
    { email: "prmarketinglead.titans@tcoer.edu.in", name: "Abduldiyan Irfan Deshmukh", position: "PR & Marketing Lead", year: "TE", role: "member", hierarchyLevel: 4 },
    { email: "prcoordinator.titans@tcoer.edu.in", name: "Mayuri Sunil Shinde", position: "PR Coordinator", year: "SE", role: "member", hierarchyLevel: 5 },
    { email: "marketingcoordinator.titans@tcoer.edu.in", name: "Shreyas Wankhade", position: "Marketing Coordinator", year: "SE", role: "member", hierarchyLevel: 5 },
    
    // MULTIMEDIA TEAM
    { email: "multimediateamlead.titans@tcoer.edu.in", name: "Sakshi Bipin Kamble", position: "Multimedia Team Lead", year: "TE", role: "member", hierarchyLevel: 4 },
    { email: "socialmediacoordinator.titans@tcoer.edu.in", name: "Ishwari Kalaskar", position: "Social Media Coordinator", year: "TE", role: "member", hierarchyLevel: 5 },
    { email: "designer.titans@tcoer.edu.in", name: "Kunal Jadhav", position: "Designer", year: "SE", role: "member", hierarchyLevel: 6 },
    { email: "associatedesigner.titans@tcoer.edu.in", name: "Shritej Jathar", position: "Associate Designer", year: "SE", role: "member", hierarchyLevel: 6 },
    { email: "videographereditor.titans@tcoer.edu.in", name: "Parth Adawade", position: "Videographer & Editor", year: "SE", role: "member", hierarchyLevel: 6 },
    
    // DISCIPLINE TEAM
    { email: "disciplineteamlead.titans@tcoer.edu.in", name: "Vaibhav Gadhave", position: "Discipline Team Lead", year: "TE", role: "member", hierarchyLevel: 4 },
    { email: "disciplinecoordinator.titans@tcoer.edu.in", name: "Payal Ranjane", position: "Discipline Coordinator", year: "SE", role: "member", hierarchyLevel: 5 },
    { email: "disciplineassociate1.titans@tcoer.edu.in", name: "Vivekanand Koli", position: "Discipline Associate", year: "SE", role: "member", hierarchyLevel: 6 },
    { email: "disciplineassociate2.titans@tcoer.edu.in", name: "Umesh Patil", position: "Discipline Associate", year: "SE", role: "member", hierarchyLevel: 6 },
    
    // DRAFTING TEAM
    { email: "documentationteamlead.titans@tcoer.edu.in", name: "Shruti Sathe", position: "Documentation Team Lead", year: "TE", role: "member", hierarchyLevel: 4 },
    { email: "magazinecoordinator.titans@tcoer.edu.in", name: "Omkar Dodke", position: "Magazine Coordinator", year: "SE", role: "member", hierarchyLevel: 5 },
    { email: "reportscoordinator.titans@tcoer.edu.in", name: "Ritesh Mahato", position: "Reports Coordinator", year: "SE", role: "member", hierarchyLevel: 5 }
  ];

  const handleUpload = async () => {
    setStatus("Uploading to Firebase...");
    try {
      for (const user of teamData) {
        // This uses the email as the unique document ID instead of a random string!
        await setDoc(doc(db, "users", user.email), user);
      }
      setStatus("✅ Success! All 37 members uploaded.");
    } catch (error) {
      console.error(error);
      setStatus("❌ Error uploading. Check console.");
    }
  };

  return (
    <div className="p-10 bg-white rounded-2xl shadow max-w-md mx-auto mt-20 text-center border-t-8 border-[#1B264F]">
      <ShieldCheck size={48} className="mx-auto text-blue-500 mb-4" />
      <h2 className="text-xl font-black text-[#1B264F] mb-2 uppercase tracking-widest">Database Setup</h2>
      <p className="text-sm text-slate-500 mb-6">Click below to push the entire TITANS committee roster to Firestore instantly.</p>
      
      <button 
        onClick={handleUpload} 
        className="w-full bg-[#FFB100] text-[#1B264F] font-black py-3 rounded-xl uppercase flex items-center justify-center gap-2 hover:bg-yellow-400 transition"
      >
        <UploadCloud size={18} /> Run Bulk Upload
      </button>
      
      <p className="mt-4 text-xs font-bold text-slate-400">{status}</p>
    </div>
  );
};

export default UploadTeam;