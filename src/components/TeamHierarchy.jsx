import React from 'react';
import { Users, Star, Code, PenTool, Shield, FileText, Trophy } from 'lucide-react';

const teamData = [
  {
    category: "CORE LEAD TEAM",
    icon: <Star className="text-yellow-500" />,
    members: [
      { pos: "President", name: "BHOOMIKA WANDHEKAR", class: "BE" },
      { pos: "Vice President", name: "IMDAD BAGWAN", class: "TE" },
      { pos: "Secretary", name: "SHIVAM BAIRAGYA", class: "BE" },
      { pos: "Treasurer", name: "MAHADEV SWAMI", class: "TE" },
      { pos: "Associate Treasurer", name: "SOUNDARYA PATIL", class: "TE" },
    ]
  },
  {
    category: "TECHNICAL TEAM",
    icon: <Code className="text-blue-500" />,
    members: [
      { pos: "Technical Secretary", name: "ARSALAAN KHAN", class: "SE" },
      { pos: "Technical Coordinator", name: "ADARSH BHANDE", class: "SE" },
      { pos: "Developer", name: "STAVAN SHALMON PADALE", class: "SE" },
      { pos: "Technical Associate", name: "ANANYA SARDAR", class: "SE" },
    ]
  },
  {
    category: "MULTIMEDIA TEAM",
    icon: <PenTool className="text-purple-500" />,
    members: [
      { pos: "Multimedia Team Lead", name: "SAKSHI BIPIN KAMBLE", class: "TE" },
      { pos: "Social Media Coordinator", name: "ISHWARI KALASKAR", class: "TE" },
      { pos: "Designer", name: "KUNAL JADHAV", class: "SE" },
      { pos: "Associate Designer", name: "SHRITEJ JATHAR", class: "SE" },
      { pos: "Videographer & Editor", name: "PARTH ADAWADE", class: "SE" },
    ]
  },
  {
    category: "SPORT TEAM",
    icon: <Trophy className="text-orange-500" />,
    members: [
      { pos: "Sports Secretary", name: "SUYASH HULAWALE", class: "TE" },
      { pos: "Sports Coordinator", name: "SHRINIVAS ADHAV", class: "TE" },
      { pos: "Sports Coordinator", name: "JADHAV POOJA", class: "TE" },
      { pos: "Sports Coordinator", name: "DHIRAJ PARDESHI", class: "SE" },
      { pos: "Sports Coordinator", name: "ARYAN SURWADE", class: "SE" },
      { pos: "Sport Coordinator", name: "PAWAN JADHAV", class: "SE" },
    ]
  }
];

const TeamHierarchy = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-blue-900">TITANS Team Hierarchy</h1>
          <p className="text-gray-600 mt-2">IT Department | TCOER | Academic Year 2025-26</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamData.map((section, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                {section.icon}
                <h2 className="font-bold text-gray-800 tracking-wide uppercase text-sm">
                  {section.category}
                </h2>
              </div>
              <div className="p-4 space-y-4">
                {section.members.map((member, mIdx) => (
                  <div key={mIdx} className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-semibold text-blue-600 uppercase">{member.pos}</p>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded font-bold">
                      {member.class}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamHierarchy;