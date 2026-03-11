package com.produtos.api.service;

import com.produtos.api.model.Comanda;
import com.produtos.api.model.ComandaItem;
import com.produtos.api.model.Produto;
import com.produtos.api.model.Usuario;
import com.produtos.api.repository.ComandaRepository;
import com.produtos.api.repository.ProdutoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComandaServiceTest {

    @Mock
    private ComandaRepository comandaRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    @InjectMocks
    private ComandaService service;

    private Comanda comanda;
    private Produto produto;
    private Usuario gerente;
    private Usuario vendedor;

    @BeforeEach
    void setUp() {
        comanda = new Comanda();
        comanda.setId(1L);
        comanda.setStatus(Comanda.Status.ABERTA);
        comanda.setDataAbertura(LocalDateTime.now());
        comanda.setItens(new ArrayList<>());

        produto = new Produto("Notebook", "Dell", new BigDecimal("3500.00"), 10);
        produto.setId(1L);

        gerente = new Usuario();
        gerente.setId(1L);
        gerente.setNome("Gerente");
        gerente.setPerfil(Usuario.Perfil.GERENTE);

        vendedor = new Usuario();
        vendedor.setId(2L);
        vendedor.setNome("Vendedor");
        vendedor.setPerfil(Usuario.Perfil.USUARIO);
    }

    @Test
    void listarTodas_deveRetornarListaDeComandas() {
        Comanda comanda2 = new Comanda();
        comanda2.setId(2L);
        when(comandaRepository.findAll()).thenReturn(Arrays.asList(comanda, comanda2));

        List<Comanda> resultado = service.listarTodas();

        assertEquals(2, resultado.size());
        verify(comandaRepository, times(1)).findAll();
    }

    @Test
    void listarTodas_deveRetornarListaVazia() {
        when(comandaRepository.findAll()).thenReturn(List.of());

        List<Comanda> resultado = service.listarTodas();

        assertTrue(resultado.isEmpty());
    }

    @Test
    void buscarPorId_deveRetornarComandaQuandoExiste() {
        when(comandaRepository.findById(1L)).thenReturn(Optional.of(comanda));

        Optional<Comanda> resultado = service.buscarPorId(1L);

        assertTrue(resultado.isPresent());
        assertEquals(1L, resultado.get().getId());
    }

    @Test
    void buscarPorId_deveRetornarVazioQuandoNaoExiste() {
        when(comandaRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Comanda> resultado = service.buscarPorId(99L);

        assertFalse(resultado.isPresent());
    }

    @Test
    void buscarPorStatus_deveRetornarComandasAbertas() {
        when(comandaRepository.findByStatus(Comanda.Status.ABERTA)).thenReturn(List.of(comanda));

        List<Comanda> resultado = service.buscarPorStatus(Comanda.Status.ABERTA);

        assertEquals(1, resultado.size());
        assertEquals(Comanda.Status.ABERTA, resultado.get(0).getStatus());
    }

    @Test
    void buscarPorCliente_deveRetornarComandasDoCliente() {
        when(comandaRepository.findByClienteId(1L)).thenReturn(List.of(comanda));

        List<Comanda> resultado = service.buscarPorCliente(1L);

        assertEquals(1, resultado.size());
    }

    @Test
    void buscarPorPeriodo_deveRetornarComandasNoPeriodo() {
        LocalDateTime inicio = LocalDateTime.now().minusDays(7);
        LocalDateTime fim = LocalDateTime.now();
        when(comandaRepository.findByDataAberturaBetween(inicio, fim)).thenReturn(List.of(comanda));

        List<Comanda> resultado = service.buscarPorPeriodo(inicio, fim);

        assertEquals(1, resultado.size());
    }

    @Test
    void buscarPorStatusEPeriodo_deveRetornarComandasFiltradas() {
        LocalDateTime inicio = LocalDateTime.now().minusDays(7);
        LocalDateTime fim = LocalDateTime.now();
        when(comandaRepository.findByStatusAndDataAberturaBetween(Comanda.Status.ABERTA, inicio, fim))
                .thenReturn(List.of(comanda));

        List<Comanda> resultado = service.buscarPorStatusEPeriodo(Comanda.Status.ABERTA, inicio, fim);

        assertEquals(1, resultado.size());
    }

    @Test
    void criar_deveCriarComandaComStatusAberta() {
        when(comandaRepository.save(any(Comanda.class))).thenReturn(comanda);

        Comanda resultado = service.criar(comanda);

        assertNotNull(resultado);
        assertEquals(Comanda.Status.ABERTA, resultado.getStatus());
        verify(comandaRepository, times(1)).save(any(Comanda.class));
    }

    @Test
    void adicionarItem_deveAdicionarItemNaComanda() {
        when(comandaRepository.findById(1L)).thenReturn(Optional.of(comanda));
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));
        when(produtoRepository.save(any(Produto.class))).thenReturn(produto);
        when(comandaRepository.save(any(Comanda.class))).thenReturn(comanda);

        Optional<Comanda> resultado = service.adicionarItem(1L, 1L, 2);

        assertTrue(resultado.isPresent());
        verify(comandaRepository).save(any(Comanda.class));
        verify(produtoRepository).save(any(Produto.class)); // Stock reserved
    }

    @Test
    void adicionarItem_deveSomarQuantidadeQuandoProdutoJaExiste() {
        ComandaItem itemExistente = new ComandaItem();
        itemExistente.setId(1L);
        itemExistente.setProduto(produto);
        itemExistente.setQuantidade(1);
        itemExistente.setPrecoUnitario(produto.getPreco());
        comanda.getItens().add(itemExistente);

        when(comandaRepository.findById(1L)).thenReturn(Optional.of(comanda));
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));
        when(produtoRepository.save(any(Produto.class))).thenReturn(produto);
        when(comandaRepository.save(any(Comanda.class))).thenReturn(comanda);

        Optional<Comanda> resultado = service.adicionarItem(1L, 1L, 3);

        assertTrue(resultado.isPresent());
        assertEquals(4, itemExistente.getQuantidade()); // 1 + 3
    }

    @Test
    void adicionarItem_deveLancarExcecaoQuandoEstoqueInsuficiente() {
        produto.setQuantidade(2);
        produto.setQuantidadeReservada(1);
        when(comandaRepository.findById(1L)).thenReturn(Optional.of(comanda));
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));

        assertThrows(IllegalStateException.class, () -> service.adicionarItem(1L, 1L, 5));
    }

    @Test
    void adicionarItem_deveLancarExcecaoQuandoComandaFechada() {
        comanda.setStatus(Comanda.Status.FECHADA);
        when(comandaRepository.findById(1L)).thenReturn(Optional.of(comanda));

        assertThrows(IllegalStateException.class, () -> service.adicionarItem(1L, 1L, 2));
    }

    @Test
    void adicionarItem_deveLancarExcecaoQuandoProdutoNaoExiste() {
        when(comandaRepository.findById(1L)).thenReturn(Optional.of(comanda));
        when(produtoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.adicionarItem(1L, 99L, 2));
    }

    @Test
    void removerItem_deveRemoverItemDaComandaAberta() {
        ComandaItem item = new ComandaItem();
        item.setId(1L);
        item.setProduto(produto);
        item.setQuantidade(2);
        produto.setQuantidadeReservada(2);
        comanda.getItens().add(item);

        when(comandaRepository.findById(1L)).thenReturn(Optional.of(comanda));
        when(produtoRepository.save(any(Produto.class))).thenReturn(produto);
        when(comandaRepository.save(any(Comanda.class))).thenReturn(comanda);

        Optional<Comanda> resultado = service.removerItem(1L, 1L, vendedor);

        assertTrue(resultado.isPresent());
        assertEquals(0, produto.getQuantidadeReservada()); // Stock restored
    }

    @Test
    void removerItem_deveLancarExcecaoQuandoFechadaEVendedor() {
        comanda.setStatus(Comanda.Status.FECHADA);
        ComandaItem item = new ComandaItem();
        item.setId(1L);
        comanda.getItens().add(item);

        when(comandaRepository.findById(1L)).thenReturn(Optional.of(comanda));

        assertThrows(IllegalStateException.class, () -> service.removerItem(1L, 1L, vendedor));
    }

    @Test
    void removerItem_devePermitirGerenteRemoverDeFechada() {
        comanda.setStatus(Comanda.Status.FECHADA);
        ComandaItem item = new ComandaItem();
        item.setId(1L);
        item.setProduto(produto);
        item.setQuantidade(2);
        comanda.getItens().add(item);

        when(comandaRepository.findById(1L)).thenReturn(Optional.of(comanda));
        when(comandaRepository.save(any(Comanda.class))).thenReturn(comanda);

        Optional<Comanda> resultado = service.removerItem(1L, 1L, gerente);

        assertTrue(resultado.isPresent());
        // Stock not restored for closed comanda (already deducted at checkout)
    }

    @Test
    void atualizarQuantidadeItem_deveAtualizarQuantidade() {
        ComandaItem item = new ComandaItem();
        item.setId(1L);
        item.setQuantidade(1);
        comanda.getItens().add(item);

        when(comandaRepository.findById(1L)).thenReturn(Optional.of(comanda));
        when(comandaRepository.save(any(Comanda.class))).thenReturn(comanda);

        Optional<Comanda> resultado = service.atualizarQuantidadeItem(1L, 1L, 5, vendedor);

        assertTrue(resultado.isPresent());
        assertEquals(5, item.getQuantidade());
    }

    @Test
    void atualizarQuantidadeItem_deveLancarExcecaoQuandoFechadaEVendedor() {
        comanda.setStatus(Comanda.Status.FECHADA);
        when(comandaRepository.findById(1L)).thenReturn(Optional.of(comanda));

        assertThrows(IllegalStateException.class,
                () -> service.atualizarQuantidadeItem(1L, 1L, 5, vendedor));
    }

    @Test
    void checkout_deveFazerCheckoutDeComandaAberta() {
        ComandaItem item = new ComandaItem();
        item.setId(1L);
        item.setProduto(produto);
        item.setQuantidade(3);
        produto.setQuantidadeReservada(3);
        comanda.getItens().add(item);

        when(comandaRepository.findById(1L)).thenReturn(Optional.of(comanda));
        when(produtoRepository.save(any(Produto.class))).thenReturn(produto);
        when(comandaRepository.save(any(Comanda.class))).thenReturn(comanda);

        Optional<Comanda> resultado = service.checkout(1L);

        assertTrue(resultado.isPresent());
        assertEquals(Comanda.Status.FECHADA, comanda.getStatus());
        assertNotNull(comanda.getDataCheckout());
        assertEquals(7, produto.getQuantidade()); // 10 - 3
        assertEquals(0, produto.getQuantidadeReservada()); // Reservation cleared
    }

    @Test
    void checkout_deveLancarExcecaoQuandoJaFechada() {
        comanda.setStatus(Comanda.Status.FECHADA);
        when(comandaRepository.findById(1L)).thenReturn(Optional.of(comanda));

        assertThrows(IllegalStateException.class, () -> service.checkout(1L));
    }

    @Test
    void reabrir_deveReabrirComanda() {
        comanda.setStatus(Comanda.Status.FECHADA);
        comanda.setDataCheckout(LocalDateTime.now());
        ComandaItem item = new ComandaItem();
        item.setId(1L);
        item.setProduto(produto);
        item.setQuantidade(3);
        produto.setQuantidade(7); // Already deducted at checkout
        produto.setQuantidadeReservada(0);
        comanda.getItens().add(item);

        when(comandaRepository.findById(1L)).thenReturn(Optional.of(comanda));
        when(produtoRepository.save(any(Produto.class))).thenReturn(produto);
        when(comandaRepository.save(any(Comanda.class))).thenReturn(comanda);

        Optional<Comanda> resultado = service.reabrir(1L);

        assertTrue(resultado.isPresent());
        assertEquals(Comanda.Status.ABERTA, comanda.getStatus());
        assertNull(comanda.getDataCheckout());
        assertEquals(10, produto.getQuantidade()); // Stock restored: 7 + 3
        assertEquals(3, produto.getQuantidadeReservada()); // Re-reserved
    }

    @Test
    void reabrir_deveLancarExcecaoQuandoEstoqueInsuficiente() {
        comanda.setStatus(Comanda.Status.FECHADA);
        comanda.setDataCheckout(LocalDateTime.now());
        ComandaItem item = new ComandaItem();
        item.setId(1L);
        item.setProduto(produto);
        item.setQuantidade(15); // More than available
        produto.setQuantidade(5);
        produto.setQuantidadeReservada(3);
        comanda.getItens().add(item);

        when(comandaRepository.findById(1L)).thenReturn(Optional.of(comanda));

        assertThrows(IllegalStateException.class, () -> service.reabrir(1L));
    }

    @Test
    void deletar_deveRetornarTrueQuandoComandaExiste() {
        when(comandaRepository.existsById(1L)).thenReturn(true);
        doNothing().when(comandaRepository).deleteById(1L);

        boolean resultado = service.deletar(1L);

        assertTrue(resultado);
        verify(comandaRepository, times(1)).deleteById(1L);
    }

    @Test
    void deletar_deveRetornarFalseQuandoComandaNaoExiste() {
        when(comandaRepository.existsById(99L)).thenReturn(false);

        boolean resultado = service.deletar(99L);

        assertFalse(resultado);
        verify(comandaRepository, never()).deleteById(any());
    }
}
