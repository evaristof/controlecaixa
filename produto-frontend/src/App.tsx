import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Package, X, Check, LogOut, Lock, Mail, User, Download, Upload, FileSpreadsheet, FileText, Users, ClipboardList, BarChart3, Menu, Camera, Search, Eye, ShoppingCart, ChevronDown, ChevronUp, Calendar, MapPin, FileImage, History } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ==================== INTERFACES ====================
interface Produto {
  id?: number;
  nome: string;
  descricao: string;
  preco: number;
  quantidade: number;
}

interface AuthUser {
  token: string;
  nome: string;
  email: string;
  perfil: string;
}

interface BatchResult {
  linha: number;
  acao: string;
  status: string;
  mensagem: string;
}

interface Cliente {
  id?: number;
  nome: string;
  endereco: string;
  documento: string;
  tipoDocumento: string;
  fotoBase64?: string;
}

interface ComandaItemData {
  id?: number;
  produtoId: number;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

interface ComandaData {
  id?: number;
  clienteId: number;
  clienteNome: string;
  clienteDocumento: string;
  usuarioId: number;
  usuarioNome: string;
  dataAbertura: string;
  dataCheckout: string | null;
  status: string;
  itens: ComandaItemData[];
  total: number;
}

type Page = 'produtos' | 'clientes' | 'comandas' | 'relatorios';

const emptyProduto: Produto = {
  nome: '',
  descricao: '',
  preco: 0,
  quantidade: 0,
};

function getStoredUser(): AuthUser | null {
  const stored = localStorage.getItem('auth_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

function authHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

function formatCurrencyValue(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  return d.toLocaleString('pt-BR');
}

// ==================== LOGIN PAGE ====================
function LoginPage({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isRegister
        ? `${API_URL}/api/auth/register`
        : `${API_URL}/api/auth/login`;

      const body = isRegister
        ? { nome, email, senha }
        : { email, senha };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao autenticar');
      }

      const user: AuthUser = {
        token: data.token,
        nome: data.nome,
        email: data.email,
        perfil: data.perfil || 'USUARIO',
      };

      localStorage.setItem('auth_user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro de conexão. Verifique se o servidor está rodando.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Controle Caixa</h1>
          <p className="text-gray-500 mt-1">
            {isRegister ? 'Crie sua conta' : 'Faça login para continuar'}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Carregando...' : isRegister ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {isRegister ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== PRODUCT PAGE ====================
function ProductPage({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [form, setForm] = useState<Produto>({ ...emptyProduto });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[] | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/produtos`, {
        headers: authHeaders(user.token),
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      if (!res.ok) throw new Error('Erro ao buscar produtos');
      const data = await res.json();
      setProdutos(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar produtos. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  }, [user.token, onLogout]);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `${API_URL}/api/produtos/${editingId}`
        : `${API_URL}/api/produtos`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(user.token),
        body: JSON.stringify(form),
      });

      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Erro ao salvar produto');
      }

      setForm({ ...emptyProduto });
      setEditingId(null);
      setShowForm(false);
      setError(null);
      fetchProdutos();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleEdit = (produto: Produto) => {
    setForm({
      nome: produto.nome,
      descricao: produto.descricao,
      preco: produto.preco,
      quantidade: produto.quantidade,
    });
    setEditingId(produto.id ?? null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const res = await fetch(`${API_URL}/api/produtos/${id}`, {
        method: 'DELETE',
        headers: authHeaders(user.token),
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      if (!res.ok) throw new Error('Erro ao excluir produto');
      setError(null);
      fetchProdutos();
    } catch (err) {
      setError('Erro ao excluir produto');
    }
  };

  const handleCancel = () => {
    setForm({ ...emptyProduto });
    setEditingId(null);
    setShowForm(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    setShowExportMenu(false);
    try {
      const res = await fetch(`${API_URL}/api/produtos/export/${format}`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      if (!res.ok) throw new Error('Erro ao exportar');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'excel' ? 'produtos.xlsx' : 'produtos.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Erro ao exportar produtos');
    }
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBatchLoading(true);
    setBatchResults(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/produtos/batch`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
        body: formData,
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      if (!res.ok) throw new Error('Erro ao processar arquivo');
      const data: BatchResult[] = await res.json();
      setBatchResults(data);
      fetchProdutos();
    } catch {
      setError('Erro ao processar arquivo batch');
    } finally {
      setBatchLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      {/* Page Header with actions */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Cadastro de Produtos</h2>
        <div className="flex items-center gap-2">
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Produto
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors"
              title="Exportar"
            >
              <Download className="w-5 h-5" />
              Exportar
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                <button
                  onClick={() => handleExport('excel')}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Exportar Excel (.xlsx)
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                >
                  <FileText className="w-4 h-4 text-red-600" />
                  Exportar PDF
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => { setShowBatchModal(true); setBatchResults(null); }}
            className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
            title="Upload Batch"
          >
            <Upload className="w-5 h-5" />
            Batch
          </button>
        </div>
      </div>

      <div>
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-8 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {editingId ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome do produto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descrição do produto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={form.preco || ''}
                    onChange={(e) => setForm({ ...form, preco: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.quantidade || ''}
                    onChange={(e) => setForm({ ...form, quantidade: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Check className="w-5 h-5" />
                  {editingId ? 'Atualizar' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Product List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Carregando produtos...</p>
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500">Nenhum produto cadastrado</h3>
            <p className="text-gray-400 mt-1">Clique em "Novo Produto" para começar</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Preço
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Qtd.
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {produtos.map((produto) => (
                    <tr key={produto.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">{produto.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {produto.nome}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {produto.descricao || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono">
                        {formatCurrency(produto.preco)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {produto.quantidade}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(produto)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => produto.id && handleDelete(produto.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Batch Upload Modal */}
        {showBatchModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Cadastro Batch</h2>
                <button onClick={() => setShowBatchModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Faça upload de um arquivo <strong>.xlsx</strong> ou <strong>.txt</strong> (separado por <code>;</code>) com as ações:
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono space-y-1">
                    <p>CadastrarProduto;nome;descricao;preco;quantidade</p>
                    <p>AlterarNome;nomeProduto;novoNome</p>
                    <p>AlterarDescricao;nomeProduto;novaDescricao</p>
                    <p>AlterarPreco;nomeProduto;novoPreco</p>
                    <p>AlterarQuantidade;nomeProduto;novaQuantidade</p>
                    <p>AlterarProduto;nomeProduto;coluna;valor</p>
                    <p>SomarQuantidade;nomeProduto;valor</p>
                    <p>SubtrairQuantidade;nomeProduto;valor</p>
                  </div>
                </div>
                <div className="mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.txt,.csv"
                    onChange={handleBatchUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {batchLoading && (
                  <div className="text-center py-4">
                    <div className="inline-block w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="mt-2 text-sm text-gray-500">Processando arquivo...</p>
                  </div>
                )}
                {batchResults && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-700 mb-2">Resultados:</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-3 py-2 text-left">Linha</th>
                            <th className="px-3 py-2 text-left">Ação</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-left">Mensagem</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {batchResults.map((r, i) => (
                            <tr key={i} className={r.status === 'OK' ? 'bg-green-50' : 'bg-red-50'}>
                              <td className="px-3 py-2">{r.linha}</td>
                              <td className="px-3 py-2 font-mono text-xs">{r.acao}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${r.status === 'OK' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs">{r.mensagem}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {batchResults.filter(r => r.status === 'OK').length} de {batchResults.length} ações executadas com sucesso.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== SIDEBAR ====================
function Sidebar({ currentPage, onNavigate, user, onLogout, collapsed, setCollapsed }: {
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

// ==================== CLIENT PAGE ====================
function ClientPage({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ nome: '', endereco: '', documento: '', tipoDocumento: 'CPF' });
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showHistory, setShowHistory] = useState<number | null>(null);
  const [comandasHistory, setComandasHistory] = useState<ComandaData[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/clientes`, { headers: authHeaders(user.token) });
      if (res.status === 401 || res.status === 403) { onLogout(); return; }
      if (!res.ok) throw new Error('Erro');
      setClientes(await res.json());
      setError(null);
    } catch {
      setError('Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  }, [user.token, onLogout]);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const resetForm = () => {
    setForm({ nome: '', endereco: '', documento: '', tipoDocumento: 'CPF' });
    setFotoPreview(null); setFotoFile(null); setEditingId(null); setShowForm(false);
    stopCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; }
      setShowCamera(true);
    } catch {
      setError('Não foi possível acessar a câmera');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFotoPreview(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('nome', form.nome);
      formData.append('endereco', form.endereco || '');
      formData.append('documento', form.documento);
      formData.append('tipoDocumento', form.tipoDocumento);

      if (fotoFile) {
        formData.append('foto', fotoFile);
      } else if (fotoPreview && fotoPreview.startsWith('data:')) {
        const resp = await fetch(fotoPreview);
        const blob = await resp.blob();
        formData.append('foto', blob, 'camera-photo.jpg');
      }

      const url = editingId ? `${API_URL}/api/clientes/${editingId}` : `${API_URL}/api/clientes`;
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
        body: formData,
      });
      if (res.status === 401 || res.status === 403) { onLogout(); return; }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Erro ao salvar');
      }
      resetForm();
      fetchClientes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  };

  const handleEdit = (c: Cliente) => {
    setForm({ nome: c.nome, endereco: c.endereco || '', documento: c.documento, tipoDocumento: c.tipoDocumento });
    setFotoPreview(c.fotoBase64 ? `data:image/jpeg;base64,${c.fotoBase64}` : null);
    setEditingId(c.id ?? null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir cliente?')) return;
    try {
      const res = await fetch(`${API_URL}/api/clientes/${id}`, { method: 'DELETE', headers: authHeaders(user.token) });
      if (res.status === 401 || res.status === 403) { onLogout(); return; }
      fetchClientes();
    } catch {
      setError('Erro ao excluir');
    }
  };

  const viewHistory = async (clienteId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/comandas/cliente/${clienteId}`, { headers: authHeaders(user.token) });
      if (res.ok) {
        setComandasHistory(await res.json());
        setShowHistory(clienteId);
      }
    } catch {
      setError('Erro ao carregar histórico');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Cadastro de Clientes</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
            <Plus className="w-5 h-5" /> Novo Cliente
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span><button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {showForm && (
        <div className="mb-8 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input type="text" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome completo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input type="text" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Endereço completo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
                <select value={form.tipoDocumento} onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="CPF">CPF</option>
                  <option value="PASSAPORTE">Passaporte</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{form.tipoDocumento === 'CPF' ? 'CPF' : 'Passaporte'} *</label>
                <input type="text" required value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={form.tipoDocumento === 'CPF' ? '000.000.000-00' : 'Número do passaporte'} />
              </div>
            </div>

            {/* Photo section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Foto</label>
              <div className="flex items-start gap-4">
                {fotoPreview && (
                  <div className="relative">
                    <img src={fotoPreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border" />
                    <button type="button" onClick={() => { setFotoPreview(null); setFotoFile(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-200 text-sm">
                    <FileImage className="w-4 h-4" /> Upload Foto
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button type="button" onClick={showCamera ? stopCamera : startCamera} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm">
                    <Camera className="w-4 h-4" /> {showCamera ? 'Fechar Câmera' : 'Tirar Foto'}
                  </button>
                </div>
              </div>
              {showCamera && (
                <div className="mt-3">
                  <video ref={videoRef} autoPlay playsInline className="w-64 h-48 object-cover rounded-lg border bg-black" />
                  <canvas ref={canvasRef} className="hidden" />
                  <button type="button" onClick={capturePhoto} className="mt-2 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                    <Camera className="w-4 h-4" /> Capturar
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"><Check className="w-5 h-5" />{editingId ? 'Atualizar' : 'Salvar'}</button>
              <button type="button" onClick={resetForm} className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300"><X className="w-5 h-5" />Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-md"><Users className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-500">Nenhum cliente cadastrado</h3></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3">
                {c.fotoBase64 ? (
                  <img src={`data:image/jpeg;base64,${c.fotoBase64}`} alt={c.nome} className="w-16 h-16 object-cover rounded-full border-2 border-gray-200" />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200"><User className="w-8 h-8 text-gray-400" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 truncate">{c.nome}</h4>
                  <p className="text-sm text-gray-500">{c.tipoDocumento}: {c.documento}</p>
                  {c.endereco && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{c.endereco}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => handleEdit(c)} className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm"><Pencil className="w-3.5 h-3.5" />Editar</button>
                <button onClick={() => c.id && viewHistory(c.id)} className="flex items-center gap-1 text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg text-sm"><History className="w-3.5 h-3.5" />Histórico</button>
                <button onClick={() => c.id && handleDelete(c.id)} className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm ml-auto"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History Modal */}
      {showHistory !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Histórico de Compras</h2>
              <button onClick={() => setShowHistory(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {comandasHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhuma comanda encontrada para este cliente.</p>
              ) : (
                <div className="space-y-4">
                  {comandasHistory.map(cmd => (
                    <div key={cmd.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Comanda #{cmd.id}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cmd.status === 'ABERTA' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{cmd.status}</span>
                      </div>
                      <p className="text-sm text-gray-500">Abertura: {formatDateTime(cmd.dataAbertura)}</p>
                      {cmd.dataCheckout && <p className="text-sm text-gray-500">Checkout: {formatDateTime(cmd.dataCheckout)}</p>}
                      <div className="mt-2">
                        {cmd.itens.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm py-1">
                            <span>{item.produtoNome} x{item.quantidade}</span>
                            <span className="font-mono">{formatCurrencyValue(item.subtotal)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold text-sm pt-2 border-t mt-2">
                          <span>Total</span><span className="font-mono">{formatCurrencyValue(cmd.total)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== COMANDA PAGE ====================
function ComandaPage({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [comandas, setComandas] = useState<ComandaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [showNewComanda, setShowNewComanda] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  const [clienteResults, setClienteResults] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedComanda, setSelectedComanda] = useState<ComandaData | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [addProdutoId, setAddProdutoId] = useState<number | string>('');
  const [addQtd, setAddQtd] = useState(1);
  const [expandedComanda, setExpandedComanda] = useState<number | null>(null);

  const fetchComandas = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/comandas`;
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterDataInicio) params.append('dataInicio', filterDataInicio);
      if (filterDataFim) params.append('dataFim', filterDataFim);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers: authHeaders(user.token) });
      if (res.status === 401 || res.status === 403) { onLogout(); return; }
      if (!res.ok) throw new Error('Erro');
      setComandas(await res.json());
      setError(null);
    } catch {
      setError('Erro ao carregar comandas.');
    } finally {
      setLoading(false);
    }
  }, [user.token, onLogout, filterStatus, filterDataInicio, filterDataFim]);

  const fetchProdutos = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/produtos`, { headers: authHeaders(user.token) });
      if (res.ok) setProdutos(await res.json());
    } catch { /* ignore */ }
  }, [user.token]);

  useEffect(() => { fetchComandas(); fetchProdutos(); }, [fetchComandas, fetchProdutos]);

  const searchCliente = async (termo: string) => {
    setClienteSearch(termo);
    if (termo.length < 2) { setClienteResults([]); return; }
    try {
      const res = await fetch(`${API_URL}/api/clientes/buscar?termo=${encodeURIComponent(termo)}`, { headers: authHeaders(user.token) });
      if (res.ok) setClienteResults(await res.json());
    } catch { /* ignore */ }
  };

  const criarComanda = async () => {
    if (!selectedCliente?.id) return;
    try {
      const res = await fetch(`${API_URL}/api/comandas`, {
        method: 'POST', headers: authHeaders(user.token),
        body: JSON.stringify({ clienteId: selectedCliente.id }),
      });
      if (res.status === 401 || res.status === 403) { onLogout(); return; }
      if (!res.ok) { const data = await res.json().catch(() => null); throw new Error(data?.message || 'Erro'); }
      const novaComanda: ComandaData = await res.json();
      setShowNewComanda(false);
      setSelectedCliente(null); setClienteSearch(''); setClienteResults([]);
      setSelectedComanda(novaComanda);
      fetchComandas();
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao criar comanda'); }
  };

  const adicionarItem = async () => {
    if (!selectedComanda?.id || !addProdutoId) return;
    try {
      const res = await fetch(`${API_URL}/api/comandas/${selectedComanda.id}/itens`, {
        method: 'POST', headers: authHeaders(user.token),
        body: JSON.stringify({ produtoId: Number(addProdutoId), quantidade: addQtd }),
      });
      if (res.status === 401 || res.status === 403) { onLogout(); return; }
      if (!res.ok) { const data = await res.json().catch(() => null); throw new Error(data?.message || 'Erro'); }
      const updated: ComandaData = await res.json();
      setSelectedComanda(updated);
      setAddProdutoId(''); setAddQtd(1);
      fetchComandas();
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao adicionar item'); }
  };

  const removerItem = async (itemId: number) => {
    if (!selectedComanda?.id) return;
    try {
      const res = await fetch(`${API_URL}/api/comandas/${selectedComanda.id}/itens/${itemId}`, {
        method: 'DELETE', headers: authHeaders(user.token),
      });
      if (res.status === 401 || res.status === 403) { onLogout(); return; }
      if (!res.ok) { const data = await res.json().catch(() => null); throw new Error(data?.message || 'Erro'); }
      const updated: ComandaData = await res.json();
      setSelectedComanda(updated);
      fetchComandas();
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao remover item'); }
  };

  const fazerCheckout = async (id: number) => {
    if (!confirm('Deseja fechar esta comanda?')) return;
    try {
      const res = await fetch(`${API_URL}/api/comandas/${id}/checkout`, { method: 'POST', headers: authHeaders(user.token) });
      if (!res.ok) { const data = await res.json().catch(() => null); throw new Error(data?.message || 'Erro'); }
      const updated: ComandaData = await res.json();
      if (selectedComanda?.id === id) setSelectedComanda(updated);
      fetchComandas();
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro no checkout'); }
  };

  const reabrirComanda = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/comandas/${id}/reabrir`, { method: 'POST', headers: authHeaders(user.token) });
      if (res.status === 403) { const data = await res.json().catch(() => null); setError(data?.message || 'Sem permissão'); return; }
      if (!res.ok) throw new Error('Erro');
      const updated: ComandaData = await res.json();
      if (selectedComanda?.id === id) setSelectedComanda(updated);
      fetchComandas();
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao reabrir'); }
  };

  const openComandaDetail = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/comandas/${id}`, { headers: authHeaders(user.token) });
      if (res.ok) setSelectedComanda(await res.json());
    } catch {
      setError('Erro ao carregar comanda');
    }
  };

  const isGerente = user.perfil === 'GERENTE';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Comandas</h2>
        <button onClick={() => setShowNewComanda(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
          <Plus className="w-5 h-5" /> Nova Comanda
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span><button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filters / Dashboard */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" />Filtros</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos</option>
              <option value="ABERTA">Abertas</option>
              <option value="FECHADA">Fechadas</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data Início</label>
            <input type="date" value={filterDataInicio} onChange={(e) => setFilterDataInicio(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data Fim</label>
            <input type="date" value={filterDataFim} onChange={(e) => setFilterDataFim(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => { setFilterStatus(''); setFilterDataInicio(''); setFilterDataFim(''); }} className="text-sm text-gray-500 hover:text-gray-700 underline">Limpar</button>
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
          <div className="bg-blue-50 rounded-lg px-4 py-2 text-center">
            <p className="text-2xl font-bold text-blue-600">{comandas.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-green-50 rounded-lg px-4 py-2 text-center">
            <p className="text-2xl font-bold text-green-600">{comandas.filter(c => c.status === 'ABERTA').length}</p>
            <p className="text-xs text-gray-500">Abertas</p>
          </div>
          <div className="bg-gray-50 rounded-lg px-4 py-2 text-center">
            <p className="text-2xl font-bold text-gray-600">{comandas.filter(c => c.status === 'FECHADA').length}</p>
            <p className="text-xs text-gray-500">Fechadas</p>
          </div>
          <div className="bg-purple-50 rounded-lg px-4 py-2 text-center">
            <p className="text-2xl font-bold text-purple-600">{formatCurrencyValue(comandas.reduce((sum, c) => sum + c.total, 0))}</p>
            <p className="text-xs text-gray-500">Valor Total</p>
          </div>
        </div>
      </div>

      {/* Comanda list */}
      {loading ? (
        <div className="text-center py-12"><div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
      ) : comandas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-md"><ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-500">Nenhuma comanda encontrada</h3></div>
      ) : (
        <div className="space-y-3">
          {comandas.map(cmd => (
            <div key={cmd.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedComanda(expandedComanda === cmd.id ? null : (cmd.id ?? null))}>
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 rounded-lg p-2"><ShoppingCart className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">#{cmd.id}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cmd.status === 'ABERTA' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{cmd.status}</span>
                    </div>
                    <p className="text-sm text-gray-500">{cmd.clienteNome} ({cmd.clienteDocumento})</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold font-mono text-gray-800">{formatCurrencyValue(cmd.total)}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(cmd.dataAbertura)}</p>
                  </div>
                  {expandedComanda === cmd.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </div>
              {expandedComanda === cmd.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <p><span className="text-gray-500">Vendedor:</span> {cmd.usuarioNome}</p>
                    <p><span className="text-gray-500">Abertura:</span> {formatDateTime(cmd.dataAbertura)}</p>
                    {cmd.dataCheckout && <p><span className="text-gray-500">Checkout:</span> {formatDateTime(cmd.dataCheckout)}</p>}
                  </div>
                  {cmd.itens.length > 0 && (
                    <table className="w-full text-sm mb-3">
                      <thead><tr className="text-gray-500 text-xs"><th className="text-left py-1">Produto</th><th className="text-right py-1">Qtd</th><th className="text-right py-1">Unit.</th><th className="text-right py-1">Subtotal</th></tr></thead>
                      <tbody>
                        {cmd.itens.map((item, i) => (
                          <tr key={i} className="border-t border-gray-200">
                            <td className="py-1">{item.produtoNome}</td>
                            <td className="py-1 text-right">{item.quantidade}</td>
                            <td className="py-1 text-right font-mono">{formatCurrencyValue(item.precoUnitario)}</td>
                            <td className="py-1 text-right font-mono">{formatCurrencyValue(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot><tr className="border-t-2 border-gray-300 font-semibold"><td colSpan={3}>Total</td><td className="text-right font-mono">{formatCurrencyValue(cmd.total)}</td></tr></tfoot>
                    </table>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => openComandaDetail(cmd.id!)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"><Eye className="w-3.5 h-3.5" />Gerenciar</button>
                    {cmd.status === 'ABERTA' && (
                      <button onClick={() => fazerCheckout(cmd.id!)} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700"><Check className="w-3.5 h-3.5" />Checkout</button>
                    )}
                    {cmd.status === 'FECHADA' && isGerente && (
                      <button onClick={() => reabrirComanda(cmd.id!)} className="flex items-center gap-1 bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-yellow-700">Reabrir</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Comanda Modal */}
      {showNewComanda && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Nova Comanda</h2>
              <button onClick={() => { setShowNewComanda(false); setSelectedCliente(null); setClienteSearch(''); setClienteResults([]); }} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar Cliente (nome ou documento)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={clienteSearch} onChange={(e) => searchCliente(e.target.value)} className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Digite o nome ou CPF/passaporte..." />
              </div>
              {clienteResults.length > 0 && !selectedCliente && (
                <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                  {clienteResults.map(c => (
                    <button key={c.id} onClick={() => { setSelectedCliente(c); setClienteSearch(c.nome); setClienteResults([]); }} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b last:border-b-0">
                      <span className="font-medium">{c.nome}</span> <span className="text-gray-400">({c.tipoDocumento}: {c.documento})</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedCliente && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{selectedCliente.nome}</p>
                    <p className="text-xs text-gray-500">{selectedCliente.tipoDocumento}: {selectedCliente.documento}</p>
                  </div>
                  <button onClick={() => { setSelectedCliente(null); setClienteSearch(''); }} className="text-red-500 hover:bg-red-50 p-1 rounded"><X className="w-4 h-4" /></button>
                </div>
              )}
              <button onClick={criarComanda} disabled={!selectedCliente} className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Abrir Comanda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comanda Detail Modal */}
      {selectedComanda && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Comanda #{selectedComanda.id}</h2>
                <p className="text-sm text-gray-500">{selectedComanda.clienteNome}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded text-sm font-semibold ${selectedComanda.status === 'ABERTA' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{selectedComanda.status}</span>
                <button onClick={() => setSelectedComanda(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[65vh]">
              {/* Add product - only if open or gerente */}
              {(selectedComanda.status === 'ABERTA' || isGerente) && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Adicionar Produto</h4>
                  <div className="flex gap-2">
                    <select value={addProdutoId} onChange={(e) => setAddProdutoId(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Selecione um produto...</option>
                      {produtos.map(p => (
                        <option key={p.id} value={p.id}>{p.nome} - {formatCurrencyValue(p.preco)} (estoque: {p.quantidade})</option>
                      ))}
                    </select>
                    <input type="number" min="1" value={addQtd} onChange={(e) => setAddQtd(parseInt(e.target.value) || 1)} className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={adicionarItem} disabled={!addProdutoId} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Items list */}
              {selectedComanda.itens.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum item adicionado</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50"><th className="px-4 py-2 text-left">Produto</th><th className="px-4 py-2 text-right">Qtd</th><th className="px-4 py-2 text-right">Preço Unit.</th><th className="px-4 py-2 text-right">Subtotal</th><th className="px-4 py-2 w-12"></th></tr></thead>
                    <tbody className="divide-y">
                      {selectedComanda.itens.map(item => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">{item.produtoNome}</td>
                          <td className="px-4 py-3 text-right">{item.quantidade}</td>
                          <td className="px-4 py-3 text-right font-mono">{formatCurrencyValue(item.precoUnitario)}</td>
                          <td className="px-4 py-3 text-right font-mono">{formatCurrencyValue(item.subtotal)}</td>
                          <td className="px-4 py-3">
                            {(selectedComanda.status === 'ABERTA' || isGerente) && (
                              <button onClick={() => item.id && removerItem(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="bg-gray-50 font-semibold"><td className="px-4 py-3" colSpan={3}>Total</td><td className="px-4 py-3 text-right font-mono">{formatCurrencyValue(selectedComanda.total)}</td><td></td></tr></tfoot>
                  </table>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                {selectedComanda.status === 'ABERTA' && (
                  <button onClick={() => fazerCheckout(selectedComanda.id!)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700">
                    <Check className="w-4 h-4" /> Fazer Checkout
                  </button>
                )}
                {selectedComanda.status === 'FECHADA' && isGerente && (
                  <button onClick={() => reabrirComanda(selectedComanda.id!)} className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-700">
                    Reabrir Comanda
                  </button>
                )}
              </div>

              <div className="mt-4 text-sm text-gray-500">
                <p>Abertura: {formatDateTime(selectedComanda.dataAbertura)}</p>
                {selectedComanda.dataCheckout && <p>Checkout: {formatDateTime(selectedComanda.dataCheckout)}</p>}
                <p>Vendedor: {selectedComanda.usuarioNome}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== RELATORIOS PAGE (placeholder) ====================
function RelatoriosPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Relatórios</h2>
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-500">Em breve</h3>
        <p className="text-gray-400 mt-1">Funcionalidade de relatórios será adicionada futuramente.</p>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
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
