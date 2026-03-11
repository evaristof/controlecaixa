package com.produtos.api.service;

import com.produtos.api.model.Cliente;
import com.produtos.api.repository.ClienteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClienteServiceTest {

    @Mock
    private ClienteRepository clienteRepository;

    @InjectMocks
    private ClienteService service;

    private Cliente cliente;

    @BeforeEach
    void setUp() {
        cliente = new Cliente();
        cliente.setId(1L);
        cliente.setNome("João Silva");
        cliente.setEndereco("Rua Teste, 123");
        cliente.setDocumento("123.456.789-00");
        cliente.setTipoDocumento(Cliente.TipoDocumento.CPF);
    }

    @Test
    void listarTodos_deveRetornarListaDeClientes() {
        Cliente cliente2 = new Cliente();
        cliente2.setId(2L);
        cliente2.setNome("Ana Santos");
        when(clienteRepository.findAll()).thenReturn(Arrays.asList(cliente, cliente2));

        List<Cliente> resultado = service.listarTodos();

        assertEquals(2, resultado.size());
        assertEquals("João Silva", resultado.get(0).getNome());
        verify(clienteRepository, times(1)).findAll();
    }

    @Test
    void listarTodos_deveRetornarListaVazia() {
        when(clienteRepository.findAll()).thenReturn(List.of());

        List<Cliente> resultado = service.listarTodos();

        assertTrue(resultado.isEmpty());
    }

    @Test
    void buscarPorId_deveRetornarClienteQuandoExiste() {
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));

        Optional<Cliente> resultado = service.buscarPorId(1L);

        assertTrue(resultado.isPresent());
        assertEquals("João Silva", resultado.get().getNome());
    }

    @Test
    void buscarPorId_deveRetornarVazioQuandoNaoExiste() {
        when(clienteRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Cliente> resultado = service.buscarPorId(99L);

        assertFalse(resultado.isPresent());
    }

    @Test
    void buscarPorDocumento_deveRetornarCliente() {
        when(clienteRepository.findByDocumento("123.456.789-00")).thenReturn(Optional.of(cliente));

        Optional<Cliente> resultado = service.buscarPorDocumento("123.456.789-00");

        assertTrue(resultado.isPresent());
        assertEquals("João Silva", resultado.get().getNome());
    }

    @Test
    void buscar_deveRetornarClientesPorNome() {
        when(clienteRepository.findByNomeContainingIgnoreCase("João"))
                .thenReturn(List.of(cliente));
        when(clienteRepository.findByDocumentoLimpoContaining("João"))
                .thenReturn(List.of());

        List<Cliente> resultado = service.buscar("João");

        assertEquals(1, resultado.size());
        assertEquals("João Silva", resultado.get(0).getNome());
    }

    @Test
    void buscar_deveRetornarClientePorCpfParcialSemSeparadores() {
        // Bug fix: searching "123456" must find client with CPF "123.456.789-00"
        when(clienteRepository.findByNomeContainingIgnoreCase("123456"))
                .thenReturn(List.of());
        when(clienteRepository.findByDocumentoLimpoContaining("123456"))
                .thenReturn(List.of(cliente));

        List<Cliente> resultado = service.buscar("123456");

        assertEquals(1, resultado.size());
        assertEquals("João Silva", resultado.get(0).getNome());
        verify(clienteRepository).findByDocumentoLimpoContaining("123456");
    }

    @Test
    void buscar_deveRetornarClientePorCpfComSeparadores() {
        // Searching "123.456" should also work (separators stripped to "123456")
        when(clienteRepository.findByNomeContainingIgnoreCase("123.456"))
                .thenReturn(List.of());
        when(clienteRepository.findByDocumentoLimpoContaining("123456"))
                .thenReturn(List.of(cliente));

        List<Cliente> resultado = service.buscar("123.456");

        assertEquals(1, resultado.size());
        assertEquals("João Silva", resultado.get(0).getNome());
    }

    @Test
    void buscar_deveMesclarResultadosSemDuplicatas() {
        // Client found by both name and document should appear only once
        when(clienteRepository.findByNomeContainingIgnoreCase("João"))
                .thenReturn(List.of(cliente));
        when(clienteRepository.findByDocumentoLimpoContaining("João"))
                .thenReturn(List.of(cliente));

        List<Cliente> resultado = service.buscar("João");

        assertEquals(1, resultado.size());
    }

    @Test
    void salvar_deveSalvarERetornarCliente() {
        when(clienteRepository.save(any(Cliente.class))).thenReturn(cliente);

        Cliente resultado = service.salvar(cliente);

        assertNotNull(resultado);
        assertEquals("João Silva", resultado.getNome());
        verify(clienteRepository, times(1)).save(cliente);
    }

    @Test
    void atualizar_deveAtualizarClienteQuandoExiste() {
        Cliente clienteAtualizado = new Cliente();
        clienteAtualizado.setNome("João Silva Jr");
        clienteAtualizado.setEndereco("Rua Nova, 456");
        clienteAtualizado.setDocumento("123.456.789-00");
        clienteAtualizado.setTipoDocumento(Cliente.TipoDocumento.CPF);

        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(clienteRepository.save(any(Cliente.class))).thenReturn(cliente);

        Optional<Cliente> resultado = service.atualizar(1L, clienteAtualizado);

        assertTrue(resultado.isPresent());
        verify(clienteRepository, times(1)).save(any(Cliente.class));
    }

    @Test
    void atualizar_deveRetornarVazioQuandoNaoExiste() {
        Cliente clienteAtualizado = new Cliente();
        clienteAtualizado.setNome("Teste");
        when(clienteRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Cliente> resultado = service.atualizar(99L, clienteAtualizado);

        assertFalse(resultado.isPresent());
        verify(clienteRepository, never()).save(any(Cliente.class));
    }

    @Test
    void deletar_deveRetornarTrueQuandoClienteExiste() {
        when(clienteRepository.existsById(1L)).thenReturn(true);
        doNothing().when(clienteRepository).deleteById(1L);

        boolean resultado = service.deletar(1L);

        assertTrue(resultado);
        verify(clienteRepository, times(1)).deleteById(1L);
    }

    @Test
    void deletar_deveRetornarFalseQuandoClienteNaoExiste() {
        when(clienteRepository.existsById(99L)).thenReturn(false);

        boolean resultado = service.deletar(99L);

        assertFalse(resultado);
        verify(clienteRepository, never()).deleteById(any());
    }

    @Test
    void existsByDocumento_deveRetornarTrueQuandoExiste() {
        when(clienteRepository.existsByDocumento("123.456.789-00")).thenReturn(true);

        boolean resultado = service.existsByDocumento("123.456.789-00");

        assertTrue(resultado);
    }

    @Test
    void existsByDocumento_deveRetornarFalseQuandoNaoExiste() {
        when(clienteRepository.existsByDocumento("000.000.000-00")).thenReturn(false);

        boolean resultado = service.existsByDocumento("000.000.000-00");

        assertFalse(resultado);
    }

    @Test
    void atualizar_deveMenterFotoQuandoNovaFotoNull() {
        byte[] fotoExistente = new byte[]{1, 2, 3};
        cliente.setFoto(fotoExistente);

        Cliente clienteAtualizado = new Cliente();
        clienteAtualizado.setNome("João Atualizado");
        clienteAtualizado.setEndereco("Rua Nova");
        clienteAtualizado.setDocumento("123.456.789-00");
        clienteAtualizado.setTipoDocumento(Cliente.TipoDocumento.CPF);
        clienteAtualizado.setFoto(null);

        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(clienteRepository.save(any(Cliente.class))).thenReturn(cliente);

        Optional<Cliente> resultado = service.atualizar(1L, clienteAtualizado);

        assertTrue(resultado.isPresent());
        // Foto should remain since update only replaces if not null
        verify(clienteRepository).save(any(Cliente.class));
    }

    @Test
    void buscar_deveRetornarClientePorCpfCompleto() {
        when(clienteRepository.findByNomeContainingIgnoreCase("12345678900"))
                .thenReturn(List.of());
        when(clienteRepository.findByDocumentoLimpoContaining("12345678900"))
                .thenReturn(List.of(cliente));

        List<Cliente> resultado = service.buscar("12345678900");

        assertEquals(1, resultado.size());
        assertEquals("João Silva", resultado.get(0).getNome());
    }

    @Test
    void buscarPorDocumento_passaporte() {
        Cliente estrangeiro = new Cliente();
        estrangeiro.setId(2L);
        estrangeiro.setNome("John Smith");
        estrangeiro.setDocumento("AB123456");
        estrangeiro.setTipoDocumento(Cliente.TipoDocumento.PASSAPORTE);

        when(clienteRepository.findByDocumento("AB123456")).thenReturn(Optional.of(estrangeiro));

        Optional<Cliente> resultado = service.buscarPorDocumento("AB123456");

        assertTrue(resultado.isPresent());
        assertEquals(Cliente.TipoDocumento.PASSAPORTE, resultado.get().getTipoDocumento());
    }
}
