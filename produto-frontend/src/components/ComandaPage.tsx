import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, X, Check, ClipboardList, Search, Eye, ShoppingCart, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import type { AuthUser, Produto, Cliente, ComandaData } from '../types';
import { API_URL, authHeaders, formatCurrencyValue, formatDateTime } from '../utils';

export function ComandaPage({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
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
  const [produtoSearch, setProdutoSearch] = useState('');
  const [showProdutoDropdown, setShowProdutoDropdown] = useState(false);

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
      // Send term as-is; backend now strips separators for document search
      const res = await fetch(`${API_URL}/api/clientes/buscar?termo=${encodeURIComponent(termo)}`, { headers: authHeaders(user.token) });
      if (res.ok) setClienteResults(await res.json());
    } catch { /* ignore */ }
  };

  const filteredProdutos = produtos.filter(p =>
    p.nome.toLowerCase().includes(produtoSearch.toLowerCase()) ||
    (p.descricao && p.descricao.toLowerCase().includes(produtoSearch.toLowerCase()))
  );

  const selectedProduto = produtos.find(p => p.id === Number(addProdutoId));

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
      setAddProdutoId(''); setAddQtd(1); setProdutoSearch('');
      fetchComandas();
      fetchProdutos(); // Refresh stock info
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
      fetchProdutos(); // Refresh stock info
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
      fetchProdutos(); // Refresh stock info
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro no checkout'); }
  };

  const reabrirComanda = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/comandas/${id}/reabrir`, { method: 'POST', headers: authHeaders(user.token) });
      if (res.status === 403) { const data = await res.json().catch(() => null); setError(data?.message || 'Sem permissão'); return; }
      if (!res.ok) { const data = await res.json().catch(() => null); throw new Error(data?.message || 'Erro'); }
      const updated: ComandaData = await res.json();
      if (selectedComanda?.id === id) setSelectedComanda(updated);
      fetchComandas();
      fetchProdutos(); // Refresh stock info
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao reabrir'); }
  };

  const deletarComanda = async (id: number) => {
    if (!confirm('Deseja excluir esta comanda? Esta ação não pode ser desfeita.')) return;
    try {
      const res = await fetch(`${API_URL}/api/comandas/${id}`, { method: 'DELETE', headers: authHeaders(user.token) });
      if (res.status === 403) { const data = await res.json().catch(() => null); setError(data?.message || 'Sem permissão'); return; }
      if (!res.ok) { const data = await res.json().catch(() => null); throw new Error(data?.message || 'Erro'); }
      if (selectedComanda?.id === id) setSelectedComanda(null);
      fetchComandas();
      fetchProdutos(); // Refresh stock info
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao excluir comanda'); }
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
                    {isGerente && (
                      <button onClick={() => deletarComanda(cmd.id!)} className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700"><Trash2 className="w-3.5 h-3.5" />Excluir</button>
                    )}
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
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={produtoSearch}
                        onChange={(e) => { setProdutoSearch(e.target.value); setShowProdutoDropdown(true); if (!e.target.value) setAddProdutoId(''); }}
                        onFocus={() => setShowProdutoDropdown(true)}
                        placeholder="Digite para buscar produto..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {showProdutoDropdown && produtoSearch && filteredProdutos.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredProdutos.map(p => {
                            const disponivel = p.quantidade - (p.quantidadeReservada || 0);
                            return (
                              <button
                                key={p.id}
                                onClick={() => { setAddProdutoId(p.id); setProdutoSearch(p.nome); setShowProdutoDropdown(false); }}
                                disabled={disponivel <= 0}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex justify-between items-center ${disponivel <= 0 ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''} ${Number(addProdutoId) === p.id ? 'bg-blue-100' : ''}`}
                              >
                                <span>{p.nome} - {formatCurrencyValue(p.preco)}</span>
                                <span className={`text-xs font-medium ${disponivel <= 0 ? 'text-red-500' : disponivel <= 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                                  {disponivel <= 0 ? 'Sem estoque' : `Disp: ${disponivel}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {showProdutoDropdown && produtoSearch && filteredProdutos.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500">
                          Nenhum produto encontrado
                        </div>
                      )}
                    </div>
                    <input type="number" min="1" max={selectedProduto ? (selectedProduto.quantidade - (selectedProduto.quantidadeReservada || 0)) : undefined} value={addQtd} onChange={(e) => setAddQtd(parseInt(e.target.value) || 1)} className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={adicionarItem} disabled={!addProdutoId} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {selectedProduto && (
                    <p className="text-xs text-gray-500 mt-1">
                      Estoque disponível: {selectedProduto.quantidade - (selectedProduto.quantidadeReservada || 0)} unidades
                    </p>
                  )}
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
