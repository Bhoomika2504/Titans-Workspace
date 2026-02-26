import React from 'react';
import { db } from './firebase';
import { doc, writeBatch } from 'firebase/firestore';

const SeedTeam = () => {
  const seed = async () => {
    const batch = writeBatch(db);
    const fullRoster = [
      // CORE LEAD TEAM
      { name: "BHOOMIKA WANDHEKAR", position: "President", class: "BE", team: "Core", role: "admin" },
      { name: "IMDAD BAGWAN", position: "Vice President", class: "TE", team: "Core", role: "executive" },
      { name: "SHIVAM BAIRAGYA", position: "Secretary", class: "BE", team: "Core", role: "executive" },
      { name: "MAHADEV SWAMI", position: "Treasurer", class: "TE", team: "Core", role: "executive" },
      { name: "SOUNDARYA PATIL", position: "Associate Treasurer", class: "TE", team: "Core", role: "executive" },

      // CULTURAL TEAM
      { name: "HARSHADA TAVHARE", position: "Cultural Secretary", class: "TE", team: "Cultural", role: "member" },
      { name: "AASHITA SOMVANSHI", position: "Cultural Coordinator", class: "SE", team: "Cultural", role: "member" },
      { name: "YUGEEN NANDGAONKAR", position: "Cultural Associate", class: "SE", team: "Cultural", role: "member" },
      { name: "SAKSHI MANE", position: "Art Coordinator", class: "TE", team: "Cultural", role: "member" },
      { name: "SANIYA SANDE", position: "Event Coordinator", class: "SE", team: "Cultural", role: "member" },
      { name: "SANIKA BHOGAWADE", position: "Event Assistant", class: "SE", team: "Cultural", role: "member" },
      { name: "SAILAXAMI PASUPULETI", position: "Dance Coordinator", class: "SE", team: "Cultural", role: "member" },

      // SPORT TEAM
      { name: "SUYASH HULAWALE", position: "Sports Secretary", class: "TE", team: "Sport", role: "member" },
      { name: "SHRINIVAS ADHAV", position: "Sports Coordinator", class: "TE", team: "Sport", role: "member" },
      { name: "JADHAV POOJA", position: "Sports Coordinator", class: "TE", team: "Sport", role: "member" },
      { name: "DHIRAJ PARDESHI", position: "Sports Coordinator", class: "SE", team: "Sport", role: "member" },
      { name: "ARYAN SURWADE", position: "Sports Coordinator", class: "SE", team: "Sport", role: "member" },
      { name: "PAWAN JADHAV", position: "Sport Coordinator", class: "SE", team: "Sport", role: "member" },

      // TECHNICAL TEAM
      { name: "ARSALAAN KHAN", position: "Technical Secretary", class: "SE", team: "Technical", role: "member" },
      { name: "ADARSH BHANDE", position: "Technical Coordinator", class: "SE", team: "Technical", role: "member" },
      { name: "STAVAN SHALMON PADALE", position: "Developer", class: "SE", team: "Technical", role: "member" },
      { name: "ANANYA SARDAR", position: "Technical Associate", class: "SE", team: "Technical", role: "member" },

      // PR & MARKETING TEAM
      { name: "ABDULDIYAN IRFAN DESHMUKH", position: "PR & Marketing Lead", class: "TE", team: "PR", role: "member" },
      { name: "MAYURI SUNIL SHINDE", position: "PR Coordinator", class: "SE", team: "PR", role: "member" },
      { name: "SHREYAS WANKHADE", position: "Marketing Coordinator", class: "SE", team: "PR", role: "member" },

      // MULTIMEDIA TEAM
      { name: "SAKSHI BIPIN KAMBLE", position: "Multimedia Team Lead", class: "TE", team: "Multimedia", role: "member" },
      { name: "ISHWARI KALASKAR", position: "Social Media Coordinator", class: "TE", team: "Multimedia", role: "member" },
      { name: "KUNAL JADHAV", position: "Designer", class: "SE", team: "Multimedia", role: "member" },
      { name: "SHRITEJ JATHAR", position: "Associate Designer", class: "SE", team: "Multimedia", role: "member" },
      { name: "PARTH ADAWADE", position: "Videographer & Editor", class: "SE", team: "Multimedia", role: "member" },

      // DISCIPLINE TEAM
      { name: "VAIBHAV GADHAVE", position: "Discipline Team Lead", class: "TE", team: "Discipline", role: "member" },
      { name: "PAYAL RANJANE", position: "Discipline Coordinator", class: "SE", team: "Discipline", role: "member" },
      { name: "VIVEKANAND KOLI", position: "Discipline Associate", class: "SE", team: "Discipline", role: "member" },
      { name: "UMESH PATIL", position: "Discipline Associate", class: "SE", team: "Discipline", role: "member" },

      // DRAFTING TEAM
      { name: "SHRUTI SATHE", position: "Documentation Team Lead", class: "TE", team: "Drafting", role: "member" },
      { name: "OMKAR DODKE", position: "Magazine Coordinator", class: "SE", team: "Drafting", role: "member" },
      { name: "RITESH MAHATO", position: "Reports Coordinator", class: "SE", team: "Drafting", role: "member" }
    ];

    fullRoster.forEach((m) => {
      // Use name as ID for seeding purposes
      const memberRef = doc(db, "users", m.name.replace(/\s+/g, '_').toLowerCase());
      batch.set(memberRef, { ...m, status: 'active' });
    });

    await batch.commit();
    alert("Full TITANS Roster (42 Members) Injected!");
  };

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6">
      <button onClick={seed} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-md">
        Deploy Full Leadership Roster
      </button>
    </div>
  );
};

export default SeedTeam;