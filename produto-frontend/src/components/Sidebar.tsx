import { Package, Users, ClipboardList, BarChart3, Menu, LogOut } from 'lucide-react';
import type { AuthUser, Page } from '../types';

export function Sidebar({ currentPage, onNavigate, user, onLogout, collapsed, setCollapsed }: {
  currentPage: Page; onNavigate: (p: Page) => void; user: AuthUser; onLogout: () => void; collapsed: boolean; setCollapsed: (v: boolean) => void;
}) {
  const menuItems: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: 'produtos', label: 'Produtos', icon: <Package className="w-5 h-5" /> },
    { page: 'clientes', label: 'Clientes', icon: <Users className="w-5 h-5" /> },
    { page: 'comandas', label: 'Comandas', icon: <ClipboardList className="w-5 h-5" /> },
    { page: 'relatorios', label: 'Relatórios', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <aside className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} min-h-screen`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && <h1 className="text-lg font-bold">Controle Caixa</h1>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-700 rounded">
          <Menu className="w-5 h-5" />
        </button>
      </div>
      {!collapsed && (
        <div className="px-4 py-3 border-b border-gray-700">
          <p className="text-sm font-medium truncate">{user.nome}</p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${user.perfil === 'GERENTE' ? 'bg-yellow-600' : 'bg-gray-600'}`}>
            {user.perfil}
          </span>
        </div>
      )}
      <nav className="flex-1 py-2">
        {menuItems.map(item => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${currentPage === item.page ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
      <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white border-t border-gray-700">
        <LogOut className="w-5 h-5" />
        {!collapsed && <span>Sair</span>}
      </button>
    </aside>
  );
}
