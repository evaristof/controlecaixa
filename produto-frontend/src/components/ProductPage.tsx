import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Package, X, Check, Download, Upload, FileSpreadsheet, FileText } from 'lucide-react';
import type { AuthUser, Produto, BatchResult } from '../types';
import { emptyProduto } from '../types';
import { API_URL, authHeaders } from '../utils';

export function ProductPage({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
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
                    min="0"
                    value={form.quantidade !== undefined && form.quantidade !== null ? form.quantidade : ''}
                    onChange={(e) => setForm({ ...form, quantidade: e.target.value === '' ? 0 : parseInt(e.target.value) })}
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
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Reservada
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Disponível
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
                        {produto.descricao || '\u2014'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono">
                        {formatCurrency(produto.preco)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {produto.quantidade}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className={`font-medium ${(produto.quantidadeReservada || 0) > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                          {produto.quantidadeReservada || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className={`font-medium ${(produto.quantidade - (produto.quantidadeReservada || 0)) <= 0 ? 'text-red-600' : (produto.quantidade - (produto.quantidadeReservada || 0)) <= 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {produto.quantidade - (produto.quantidadeReservada || 0)}
                        </span>
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
