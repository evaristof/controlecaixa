import { useState } from 'react';
import type { AuthUser, Page } from './types';
import { getStoredUser } from './utils';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { ProductPage } from './components/ProductPage';
import { ClientPage } from './components/ClientPage';
import { ComandaPage } from './components/ComandaPage';
import { RelatoriosPage } from './components/RelatoriosPage';

function App() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [currentPage, setCurrentPage] = useState<Page>('produtos');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogin = (authUser: AuthUser) => {
    setUser(authUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} user={user} onLogout={handleLogout} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className="flex-1 p-6 overflow-auto">
        {currentPage === 'produtos' && <ProductPage user={user} onLogout={handleLogout} />}
        {currentPage === 'clientes' && <ClientPage user={user} onLogout={handleLogout} />}
        {currentPage === 'comandas' && <ComandaPage user={user} onLogout={handleLogout} />}
        {currentPage === 'relatorios' && <RelatoriosPage />}
      </main>
    </div>
  );
}

export default App;
