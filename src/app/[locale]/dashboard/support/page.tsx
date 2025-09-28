'use client';

// DashboardLayout removido - já aplicado pelo layout.tsx
import { useState } from "react";

const faqData = [
  {
    question: "Como faço minha primeira doação?",
    answer: "Vá para a página \"Doar\", encontre os dados do recebedor, faça a transferência e envie o comprovante na mesma página."
  },
  {
    question: "O que acontece se o recebedor não confirmar minha doação?",
    answer: "Após você confirmar o envio com o comprovante, o recebedor tem 24 horas para confirmar. Se não o fizer, o sistema confirmará automaticamente para você."
  },
  {
    question: "Como vejo minha rede?",
    answer: "Acesse a página \"Equipes\" para ver seus indicados diretos, indiretos e quem chegou por derramamento."
  }
];

const FaqItem = ({ q, a }: { q: string, a: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-700">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left py-4 px-2">
        <span className="font-semibold text-white">{q}</span>
        <span className={`transform transition-transform duration-200 ${isOpen ? '-rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && <div className="p-4 bg-gray-700 rounded-b-lg"><p className="text-gray-300">{a}</p></div>}
    </div>
  )
}

export default function SupportPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Suporte</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Support */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-green-400 mb-4">Suporte ao Vivo</h2>
          <div className="space-y-4">
            <div className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">Suporte 1</h3>
                <p className="text-sm text-gray-400">Online</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Fila: <span className="font-bold text-white">2</span></p>
                <button className="mt-1 bg-green-600 text-white text-sm font-bold py-1 px-3 rounded-md">Entrar</button>
              </div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">Suporte 2</h3>
                <p className="text-sm text-gray-400">Offline</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Fila: <span className="font-bold text-white">0</span></p>
                <button className="mt-1 bg-gray-600 text-white text-sm font-bold py-1 px-3 rounded-md" disabled>Entrar</button>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-gray-700 pt-4">
             <h3 className="font-bold text-white mb-2">Deixar uma pergunta</h3>
             <textarea className="w-full p-3 bg-gray-700 rounded-md border border-gray-600" rows={3} placeholder="Sua pergunta..."></textarea>
             <button className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-md">Enviar Pergunta</button>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-green-400 mb-4">Perguntas Frequentes</h2>
          <div className="space-y-2">
            {faqData.map((item, index) => <FaqItem key={index} q={item.question} a={item.answer} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
