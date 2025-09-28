
'use client';

// DashboardLayout removido - já aplicado pelo layout.tsx
import { useState } from "react";

// Mock data
const cyclesData = {
  'RENDA 10 / 1': {
    id: 'r10-1',
    plan: 'RENDA 10',
    cycleNumber: 1,
    currency: 'R$',
    participants: [
      { username: 'ana.silva', email: 'a@a.com', whatsapp: '111' },
      { username: 'bruno.costa', email: 'b@b.com', whatsapp: '222' },
    ]
  },
  'RENDA 10 / 2': {
    id: 'r10-2',
    plan: 'RENDA 10',
    cycleNumber: 2,
    currency: 'R$',
    participants: [
      { username: 'user3', email: 'user3@c.com', whatsapp: '333' },
    ]
  },
  'RENDA 50 / 1': {
    id: 'r50-1',
    plan: 'RENDA 50',
    cycleNumber: 1,
    currency: '$',
    participants: []
  },
};

type Cycle = typeof cyclesData[keyof typeof cyclesData];

export default function CyclesPage() {
  const [selectedCycle, setSelectedCycle] = useState<Cycle>(cyclesData['RENDA 10 / 1']);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Meus Ciclos</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cycle List */}
        <div className="md:col-span-1 bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-green-400 mb-4">Ciclos Ativos</h2>
          <ul className="space-y-2">{Object.keys(cyclesData).map(cycleName => (
              <li key={cycleName}>
                <button 
                  onClick={() => setSelectedCycle(cyclesData[cycleName as keyof typeof cyclesData])}
                  className={`w-full text-left p-3 rounded-md transition-colors duration-200 ${selectedCycle.id === cyclesData[cycleName as keyof typeof cyclesData].id ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>
                  {cycleName}
                </button>
              </li>
            ))}</ul>
        </div>

        {/* Selected Cycle Details */}
        <div className="md:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-4">
            Detalhes do Ciclo: {selectedCycle.plan} #{selectedCycle.cycleNumber} ({selectedCycle.currency})
          </h2>
          {selectedCycle.participants.length > 0 ? (
            <ul className="space-y-3">{selectedCycle.participants.map(p => (
                <li key={p.email} className="bg-gray-700 p-4 rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">{p.username}</p>
                    <p className="text-sm text-gray-400">{p.email}</p>
                  </div>
                  <a href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`} target="_blank" className="text-green-400 hover:underline text-sm">WhatsApp</a>
                </li>
              ))}</ul>
          ) : (
            <p className="text-gray-400">Nenhum participante neste ciclo ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
