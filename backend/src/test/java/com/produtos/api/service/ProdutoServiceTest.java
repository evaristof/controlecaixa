package com.produtos.api.service;

import com.produtos.api.model.Produto;
import com.produtos.api.repository.ProdutoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProdutoServiceTest {

    @Mock
    private ProdutoRepository repository;

    @InjectMocks
    private ProdutoService service;

    private Produto produto;

    @BeforeEach
    void setUp() {
        produto = new Produto("Notebook", "Notebook Dell", new BigDecimal("3500.00"), 10);
        produto.setId(1L);
    }

    @Test
    void listarTodos_deveRetornarListaDeProdutos() {
        Produto produto2 = new Produto("Mouse", "Mouse Logitech", new BigDecimal("150.00"), 50);
        produto2.setId(2L);
        when(repository.findAll()).thenReturn(Arrays.asList(produto, produto2));

        List<Produto> resultado = service.listarTodos();

        assertEquals(2, resultado.size());
        assertEquals("Notebook", resultado.get(0).getNome());
        assertEquals("Mouse", resultado.get(1).getNome());
        verify(repository, times(1)).findAll();
    }

    @Test
    void listarTodos_deveRetornarListaVazia() {
        when(repository.findAll()).thenReturn(List.of());

        List<Produto> resultado = service.listarTodos();

        assertTrue(resultado.isEmpty());
    }

    @Test
    void buscarPorId_deveRetornarProdutoQuandoExiste() {
        when(repository.findById(1L)).thenReturn(Optional.of(produto));

        Optional<Produto> resultado = service.buscarPorId(1L);

        assertTrue(resultado.isPresent());
        assertEquals("Notebook", resultado.get().getNome());
    }

    @Test
    void buscarPorId_deveRetornarVazioQuandoNaoExiste() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        Optional<Produto> resultado = service.buscarPorId(99L);

        assertFalse(resultado.isPresent());
    }

    @Test
    void salvar_deveSalvarERetornarProduto() {
        when(repository.save(any(Produto.class))).thenReturn(produto);

        Produto resultado = service.salvar(produto);

        assertNotNull(resultado);
        assertEquals("Notebook", resultado.getNome());
        assertEquals(new BigDecimal("3500.00"), resultado.getPreco());
        verify(repository, times(1)).save(produto);
    }

    @Test
    void atualizar_deveAtualizarProdutoQuandoExiste() {
        Produto produtoAtualizado = new Produto("Notebook Pro", "Notebook Dell Pro", new BigDecimal("5000.00"), 5);
        when(repository.findById(1L)).thenReturn(Optional.of(produto));
        when(repository.save(any(Produto.class))).thenReturn(produto);

        Optional<Produto> resultado = service.atualizar(1L, produtoAtualizado);

        assertTrue(resultado.isPresent());
        verify(repository, times(1)).save(any(Produto.class));
    }

    @Test
    void atualizar_deveRetornarVazioQuandoNaoExiste() {
        Produto produtoAtualizado = new Produto("Notebook Pro", "Notebook Dell Pro", new BigDecimal("5000.00"), 5);
        when(repository.findById(99L)).thenReturn(Optional.empty());

        Optional<Produto> resultado = service.atualizar(99L, produtoAtualizado);

        assertFalse(resultado.isPresent());
        verify(repository, never()).save(any(Produto.class));
    }

    @Test
    void deletar_deveRetornarTrueQuandoProdutoExiste() {
        when(repository.existsById(1L)).thenReturn(true);
        doNothing().when(repository).deleteById(1L);

        boolean resultado = service.deletar(1L);

        assertTrue(resultado);
        verify(repository, times(1)).deleteById(1L);
    }

    @Test
    void deletar_deveRetornarFalseQuandoProdutoNaoExiste() {
        when(repository.existsById(99L)).thenReturn(false);

        boolean resultado = service.deletar(99L);

        assertFalse(resultado);
        verify(repository, never()).deleteById(any());
    }
}
