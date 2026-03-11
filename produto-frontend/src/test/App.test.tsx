import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

describe('App - Tela de Login', () => {
  it('deve renderizar o formulário de login por padrão', () => {
    render(<App />);

    expect(screen.getByText('Controle Caixa')).toBeInTheDocument();
    expect(screen.getByText('Faça login para continuar')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mínimo 6 caracteres')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('deve alternar para tela de cadastro ao clicar no link', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('Não tem conta? Cadastre-se'));

    expect(screen.getByText('Crie sua conta')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Seu nome')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeInTheDocument();
  });

  it('deve alternar de volta para login ao clicar no link', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('Não tem conta? Cadastre-se'));
    await user.click(screen.getByText('Já tem conta? Faça login'));

    expect(screen.getByText('Faça login para continuar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('deve fazer login com sucesso e mostrar menu lateral', async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'fake-token', nome: 'Teste', email: 'teste@email.com', perfil: 'USUARIO' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

    render(<App />);

    await user.type(screen.getByPlaceholderText('seu@email.com'), 'teste@email.com');
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), '123456');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    // Sidebar shows user info
    expect(screen.getByText('Teste')).toBeInTheDocument();
    expect(screen.getByText('teste@email.com')).toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'auth_user',
      expect.stringContaining('fake-token')
    );
  });

  it('deve mostrar erro quando login falha', async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Email ou senha inválidos' }),
    });

    render(<App />);

    await user.type(screen.getByPlaceholderText('seu@email.com'), 'teste@email.com');
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'senhaerrada');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByText('Email ou senha inválidos')).toBeInTheDocument();
    });
  });

  it('deve fazer cadastro com sucesso', async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'fake-token', nome: 'Novo User', email: 'novo@email.com', perfil: 'USUARIO' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

    render(<App />);

    await user.click(screen.getByText('Não tem conta? Cadastre-se'));
    await user.type(screen.getByPlaceholderText('Seu nome'), 'Novo User');
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'novo@email.com');
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), '123456');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

  });
});

describe('App - Menu de Navegação', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify({ token: 'fake-token', nome: 'Teste', email: 'teste@email.com', perfil: 'GERENTE' })
    );
  });

  it('deve exibir o menu lateral com todos os itens', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([]),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Produtos')).toBeInTheDocument();
    });

    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Comandas')).toBeInTheDocument();
    expect(screen.getByText('Relatórios')).toBeInTheDocument();
  });

  it('deve exibir perfil do usuário no menu', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([]),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Teste')).toBeInTheDocument();
    });

    expect(screen.getByText('teste@email.com')).toBeInTheDocument();
    expect(screen.getByText('GERENTE')).toBeInTheDocument();
  });

  it('deve navegar para a tela de Clientes', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Clientes'));

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Clientes')).toBeInTheDocument();
    });
  });

  it('deve navegar para a tela de Comandas', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Comandas'));

    await waitFor(() => {
      expect(screen.getByText('Nova Comanda')).toBeInTheDocument();
    });
  });

  it('deve navegar para a tela de Relatórios', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([]),
    });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Relatórios'));

    await waitFor(() => {
      expect(screen.getByText('Em breve')).toBeInTheDocument();
    });
    expect(screen.getByText('Funcionalidade de relatórios será adicionada futuramente.')).toBeInTheDocument();
  });
});

describe('App - Tela de Produtos (autenticado)', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify({ token: 'fake-token', nome: 'Teste', email: 'teste@email.com', perfil: 'USUARIO' })
    );
  });

  it('deve mostrar tela de produtos quando há token salvo', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([]),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });
  });

  it('deve exibir lista de produtos', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([
        { id: 1, nome: 'Notebook', descricao: 'Dell', preco: 3500, quantidade: 10 },
        { id: 2, nome: 'Mouse', descricao: 'Logitech', preco: 150, quantidade: 50 },
      ]),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Notebook')).toBeInTheDocument();
    });
    expect(screen.getByText('Mouse')).toBeInTheDocument();
  });

  it('deve enviar Authorization header nas requisições', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([]),
    });

    render(<App />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/produtos'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
          }),
        })
      );
    });
  });

  it('deve fazer logout ao clicar no botão Sair', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([]),
    });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Sair'));

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
    expect(screen.getByText('Faça login para continuar')).toBeInTheDocument();
  });

  it('deve redirecionar para login quando recebe 401', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Faça login para continuar')).toBeInTheDocument();
    });
  });

  it('deve mostrar formulário de novo produto ao clicar no botão', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([]),
    });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Novo Produto/i }));

    expect(screen.getByPlaceholderText('Nome do produto')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Descrição do produto')).toBeInTheDocument();
  });

  it('deve exibir mensagem quando não há produtos', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([]),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum produto cadastrado')).toBeInTheDocument();
    });
  });

  it('deve mostrar botão de Exportar na tela de produtos', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([]),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Exportar/i })).toBeInTheDocument();
  });

  it('deve mostrar menu de exportação ao clicar no botão Exportar', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([]),
    });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Exportar/i }));

    expect(screen.getByText('Exportar Excel (.xlsx)')).toBeInTheDocument();
    expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
  });

  it('deve fazer download de Excel ao clicar na opção', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: async () => new Blob(['excel-data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      });

    const mockCreateObjectURL = vi.fn(() => 'blob:fake-url');
    const mockRevokeObjectURL = vi.fn();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Exportar/i }));
    await user.click(screen.getByText('Exportar Excel (.xlsx)'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/produtos/export/excel'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
          }),
        })
      );
    });
  });

  it('deve fazer download de PDF ao clicar na opção', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: async () => new Blob(['pdf-data'], { type: 'application/pdf' }),
      });

    const mockCreateObjectURL = vi.fn(() => 'blob:fake-url');
    const mockRevokeObjectURL = vi.fn();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Exportar/i }));
    await user.click(screen.getByText('Exportar PDF'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/produtos/export/pdf'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
          }),
        })
      );
    });
  });

  it('deve mostrar botão de Batch na tela de produtos', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([]),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Batch/i })).toBeInTheDocument();
  });

  it('deve abrir modal de batch ao clicar no botão', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([]),
    });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Batch/i }));

    expect(screen.getByText('Cadastro Batch')).toBeInTheDocument();
    expect(screen.getByText(/CadastrarProduto;nome;descricao;preco;quantidade/)).toBeInTheDocument();
    expect(screen.getByText(/AlterarNome;nomeProduto;novoNome/)).toBeInTheDocument();
    expect(screen.getByText(/SomarQuantidade;nomeProduto;valor/)).toBeInTheDocument();
    expect(screen.getByText(/SubtrairQuantidade;nomeProduto;valor/)).toBeInTheDocument();
  });

  it('deve fechar modal de batch ao clicar no X', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([]),
    });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Batch/i }));
    expect(screen.getByText('Cadastro Batch')).toBeInTheDocument();

    // Find the close button inside the modal header
    const modal = screen.getByText('Cadastro Batch').closest('div');
    const closeButtons = modal!.parentElement!.querySelectorAll('button');
    // The close button is the one next to the title
    await user.click(closeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('Cadastro Batch')).not.toBeInTheDocument();
    });
  });

  it('deve processar upload de arquivo batch e mostrar resultados', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([
          { linha: 1, acao: 'CadastrarProduto', status: 'OK', mensagem: "Produto 'Mouse' cadastrado com sucesso" },
          { linha: 2, acao: 'CadastrarProduto', status: 'ERRO', mensagem: 'Preço inválido: abc' },
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([{ id: 1, nome: 'Mouse', descricao: 'Mouse USB', preco: 29.90, quantidade: 50 }]),
      });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Batch/i }));

    const file = new File(
      ['CadastrarProduto;Mouse;Mouse USB;29.90;50\nCadastrarProduto;Invalido;Desc;abc;10'],
      'batch.txt',
      { type: 'text/plain' }
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Resultados:')).toBeInTheDocument();
    });

    expect(screen.getByText('1 de 2 ações executadas com sucesso.')).toBeInTheDocument();
  });
});

describe('App - Tela de Clientes', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify({ token: 'fake-token', nome: 'Teste', email: 'teste@email.com', perfil: 'GERENTE' })
    );
  });

  it('deve exibir lista de clientes', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([
          { id: 1, nome: 'João Silva', documento: '123.456.789-00', tipoDocumento: 'CPF', endereco: 'Rua A' },
          { id: 2, nome: 'John Smith', documento: 'AB123456', tipoDocumento: 'PASSAPORTE', endereco: '' },
        ]),
      });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Clientes'));

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('deve mostrar formulário de novo cliente', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Clientes'));

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Clientes')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Novo Cliente/i }));

    expect(screen.getByPlaceholderText('Nome completo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Endereço completo')).toBeInTheDocument();
  });

  it('deve exibir mensagem quando não há clientes', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Clientes'));

    await waitFor(() => {
      expect(screen.getByText('Nenhum cliente cadastrado')).toBeInTheDocument();
    });
  });

  it('deve ter botões de upload de foto e câmera', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Clientes'));

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Clientes')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Novo Cliente/i }));

    expect(screen.getByText('Upload Foto')).toBeInTheDocument();
    expect(screen.getByText('Tirar Foto')).toBeInTheDocument();
  });
});

describe('App - Tela de Comandas', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify({ token: 'fake-token', nome: 'Gerente', email: 'gerente@email.com', perfil: 'GERENTE' })
    );
  });

  it('deve exibir dashboard com filtros', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Comandas'));

    await waitFor(() => {
      expect(screen.getByText('Filtros')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Abertas').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Fechadas').length).toBeGreaterThanOrEqual(1);
  });

  it('deve exibir mensagem quando não há comandas', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Comandas'));

    await waitFor(() => {
      expect(screen.getByText('Nenhuma comanda encontrada')).toBeInTheDocument();
    });
  });

  it('deve abrir modal de nova comanda', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro de Produtos')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Comandas'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nova Comanda/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nova Comanda/i }));

    expect(screen.getByPlaceholderText('Digite o nome ou CPF/passaporte...')).toBeInTheDocument();
  });
});
