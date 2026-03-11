export interface Produto {
  id?: number;
  nome: string;
  descricao: string;
  preco: number;
  quantidade: number;
  quantidadeReservada?: number;
}

export interface AuthUser {
  token: string;
  nome: string;
  email: string;
  perfil: string;
}

export interface BatchResult {
  linha: number;
  acao: string;
  status: string;
  mensagem: string;
}

export interface Cliente {
  id?: number;
  nome: string;
  endereco: string;
  documento: string;
  tipoDocumento: string;
  fotoBase64?: string;
}

export interface ComandaItemData {
  id?: number;
  produtoId: number;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface ComandaData {
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

export type Page = 'produtos' | 'clientes' | 'comandas' | 'relatorios';

export const emptyProduto: Produto = {
  nome: '',
  descricao: '',
  preco: 0,
  quantidade: 0,
};
