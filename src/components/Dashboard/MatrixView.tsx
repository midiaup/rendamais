'use client';

import React from 'react';
// CORREÇÃO: Importando da configuração de navegação local
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

// Define a type for the participants in the matrix
type Participant = {
  username: string;
  email: string;
  whatsapp: string;
  level: number;
  position: number;
};

type MatrixViewProps = {
  title: string;
  currency: string;
  participants: Participant[];
};

const MatrixView: React.FC<MatrixViewProps> = ({ title, currency, participants }) => {
  const t = useTranslations('Dashboard');
  const levels: { [key: number]: Participant[] } = {};

  // Sua lógica para organizar os participantes por nível (mantida)
  participants.forEach(p => {
    if (!levels[p.level]) {
      levels[p.level] = [];
    }
    levels[p.level].push(p);
  });

  // Sua lógica para ordenar os participantes por posição (mantida)
  for (const level in levels) {
    levels[level].sort((a, b) => a.position - b.position);
  }

  return (
    // ##### AQUI APLICAMOS O NOVO DESIGN #####
    <div className="
      bg-slate-800           // Fundo um pouco mais claro que o principal
      border border-slate-700 // Borda sutil para definição
      rounded-xl              // Cantos mais arredondados
      p-6                     // Espaçamento interno
      shadow-lg               // Sombra para dar profundidade
      flex flex-col           // Organiza o conteúdo em coluna
      h-full                  // Garante que todos os cards na mesma linha tenham a mesma altura
      transition-all duration-300 // Animação suave para o hover
      hover:border-green-500  // Borda verde ao passar o mouse
      hover:scale-[1.02]      // Efeito de zoom sutil
      hover:shadow-green-500/10 // Sombra verde sutil no hover
    ">
      
      {/* O título agora fica no topo do card */}
      <h2 className="text-xl font-bold text-green-400 mb-4 text-center">{title} ({currency})</h2>

      {/* Container para o conteúdo principal do card */}
      <div className="flex-grow">
        {participants.length > 0 ? (
          // Se houver participantes, mostra a sua grade de níveis
          <div className="space-y-4">
            {Object.entries(levels).map(([level, users]) => (
              <div key={level}>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Nível {level}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {users.map((user, index) => (
                    <div key={`${level}-${index}`} className="relative bg-gray-700 p-2 rounded-md text-center group">
                      <p className="text-white text-sm font-medium truncate" title={user.username}>{user.username}</p>
                      {/* Tooltip com informações do usuário */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <p><strong>Username:</strong> {user.username}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>WhatsApp:</strong> {user.whatsapp}</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Se não houver participantes, mostra o botão "DOE"
          <div className="flex flex-col justify-center items-center h-full text-center py-4">
            <p className="text-gray-500 mb-4">{t('inativo')}</p>
            <Link href="/dashboard/donate" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
              DOE
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatrixView;
