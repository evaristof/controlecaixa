import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Check, Users, User, Camera, Search, MapPin, FileImage, History } from 'lucide-react';
import type { AuthUser, Cliente, ComandaData } from '../types';
import { API_URL, authHeaders, formatCurrencyValue, formatDateTime } from '../utils';

export function ClientPage({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
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
