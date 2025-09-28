'use client';

// CORREÇÃO: Importando da configuração de navegação local
import { Link, usePathname } from '@/lib/navigation';
import { ReactNode } from 'react';

export const NavLink = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string; }) => {
    const pathname = usePathname();
    // A lógica de ativação foi aprimorada para lidar com rotas aninhadas
    const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 relative ${isActive ? 'text-white bg-gray-700/50' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}
        >
            {icon}
            <span className="font-medium">{label}</span>
            {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-green-400 rounded-full shadow-[0_0_12px_theme(colors.green.400)]" />
            )}
        </Link>
    );
};