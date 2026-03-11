package com.produtos.api.service;

import com.produtos.api.dto.BatchResult;
import com.produtos.api.model.Produto;
import com.produtos.api.repository.ProdutoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BatchServiceTest {

    @Mock
    private ProdutoRepository produtoRepository;

    @InjectMocks
    private BatchService batchService;

    private Produto produtoExistente;

    @BeforeEach
    void setUp() {
        produtoExistente = new Produto("Notebook", "Notebook Dell", new BigDecimal("3500.00"), 10);
        produtoExistente.setId(1L);
    }

    @Test
    void cadastrarProduto_deveCadastrarComSucesso() {
        String[] parts = {"CadastrarProduto", "Mouse", "Mouse USB", "29.90", "50"};
        when(produtoRepository.save(any(Produto.class))).thenReturn(new Produto());

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("OK", result.getStatus());
        assertEquals("CadastrarProduto", result.getAcao());
        verify(produtoRepository).save(any(Produto.class));
    }

    @Test
    void cadastrarProduto_deveRetornarErroComColunasInsuficientes() {
        String[] parts = {"CadastrarProduto", "Mouse", "Mouse USB"};

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("ERRO", result.getStatus());
        assertTrue(result.getMensagem().contains("Esperado 5 colunas"));
    }

    @Test
    void cadastrarProduto_deveRetornarErroComPrecoInvalido() {
        String[] parts = {"CadastrarProduto", "Mouse", "Mouse USB", "abc", "50"};

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("ERRO", result.getStatus());
        assertTrue(result.getMensagem().contains("Preço inválido"));
    }

    @Test
    void cadastrarProduto_deveRetornarErroComQuantidadeInvalida() {
        String[] parts = {"CadastrarProduto", "Mouse", "Mouse USB", "29.90", "abc"};

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("ERRO", result.getStatus());
        assertTrue(result.getMensagem().contains("Quantidade inválida"));
    }

    @Test
    void alterarNome_deveAlterarComSucesso() {
        String[] parts = {"AlterarNome", "Notebook", "Notebook Gamer"};
        when(produtoRepository.findByNome("Notebook")).thenReturn(Optional.of(produtoExistente));
        when(produtoRepository.save(any(Produto.class))).thenReturn(produtoExistente);

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("OK", result.getStatus());
        verify(produtoRepository).save(any(Produto.class));
    }

    @Test
    void alterarNome_deveRetornarErroProdutoNaoEncontrado() {
        String[] parts = {"AlterarNome", "ProdutoInexistente", "NovoNome"};
        when(produtoRepository.findByNome("ProdutoInexistente")).thenReturn(Optional.empty());

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("ERRO", result.getStatus());
        assertTrue(result.getMensagem().contains("Produto não encontrado"));
    }

    @Test
    void alterarNome_deveRetornarErroComColunasInsuficientes() {
        String[] parts = {"AlterarNome", "Notebook"};

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("ERRO", result.getStatus());
        assertTrue(result.getMensagem().contains("Esperado 3 colunas"));
    }

    @Test
    void alterarDescricao_deveAlterarComSucesso() {
        String[] parts = {"AlterarDescricao", "Notebook", "Notebook Dell Inspiron 15"};
        when(produtoRepository.findByNome("Notebook")).thenReturn(Optional.of(produtoExistente));
        when(produtoRepository.save(any(Produto.class))).thenReturn(produtoExistente);

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("OK", result.getStatus());
        assertTrue(result.getMensagem().contains("Descrição"));
    }

    @Test
    void alterarPreco_deveAlterarComSucesso() {
        String[] parts = {"AlterarPreco", "Notebook", "4000.00"};
        when(produtoRepository.findByNome("Notebook")).thenReturn(Optional.of(produtoExistente));
        when(produtoRepository.save(any(Produto.class))).thenReturn(produtoExistente);

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("OK", result.getStatus());
        assertTrue(result.getMensagem().contains("Preço"));
    }

    @Test
    void alterarPreco_deveRetornarErroComPrecoInvalido() {
        String[] parts = {"AlterarPreco", "Notebook", "abc"};

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("ERRO", result.getStatus());
        assertTrue(result.getMensagem().contains("Preço inválido"));
    }

    @Test
    void alterarQuantidade_deveAlterarComSucesso() {
        String[] parts = {"AlterarQuantidade", "Notebook", "20"};
        when(produtoRepository.findByNome("Notebook")).thenReturn(Optional.of(produtoExistente));
        when(produtoRepository.save(any(Produto.class))).thenReturn(produtoExistente);

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("OK", result.getStatus());
        assertTrue(result.getMensagem().contains("Quantidade"));
    }

    @Test
    void alterarProduto_deveAlterarNomeComSucesso() {
        String[] parts = {"AlterarProduto", "Notebook", "nome", "Notebook Pro"};
        when(produtoRepository.findByNome("Notebook")).thenReturn(Optional.of(produtoExistente));
        when(produtoRepository.save(any(Produto.class))).thenReturn(produtoExistente);

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("OK", result.getStatus());
    }

    @Test
    void alterarProduto_deveAlterarDescricaoComSucesso() {
        String[] parts = {"AlterarProduto", "Notebook", "descricao", "Nova descricao"};
        when(produtoRepository.findByNome("Notebook")).thenReturn(Optional.of(produtoExistente));
        when(produtoRepository.save(any(Produto.class))).thenReturn(produtoExistente);

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("OK", result.getStatus());
    }

    @Test
    void alterarProduto_deveAlterarPrecoComSucesso() {
        String[] parts = {"AlterarProduto", "Notebook", "preco", "5000.00"};
        when(produtoRepository.findByNome("Notebook")).thenReturn(Optional.of(produtoExistente));
        when(produtoRepository.save(any(Produto.class))).thenReturn(produtoExistente);

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("OK", result.getStatus());
    }

    @Test
    void alterarProduto_deveAlterarQuantidadeComSucesso() {
        String[] parts = {"AlterarProduto", "Notebook", "quantidade", "100"};
        when(produtoRepository.findByNome("Notebook")).thenReturn(Optional.of(produtoExistente));
        when(produtoRepository.save(any(Produto.class))).thenReturn(produtoExistente);

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("OK", result.getStatus());
    }

    @Test
    void alterarProduto_deveRetornarErroColunaDesconhecida() {
        String[] parts = {"AlterarProduto", "Notebook", "cor", "azul"};
        when(produtoRepository.findByNome("Notebook")).thenReturn(Optional.of(produtoExistente));

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("ERRO", result.getStatus());
        assertTrue(result.getMensagem().contains("Coluna desconhecida"));
    }

    @Test
    void somarQuantidade_deveSomarComSucesso() {
        String[] parts = {"SomarQuantidade", "Notebook", "5"};
        when(produtoRepository.findByNome("Notebook")).thenReturn(Optional.of(produtoExistente));
        when(produtoRepository.save(any(Produto.class))).thenReturn(produtoExistente);

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("OK", result.getStatus());
        assertTrue(result.getMensagem().contains("somada"));
        assertTrue(result.getMensagem().contains("15"));
    }

    @Test
    void somarQuantidade_deveRetornarErroProdutoNaoEncontrado() {
        String[] parts = {"SomarQuantidade", "Inexistente", "5"};
        when(produtoRepository.findByNome("Inexistente")).thenReturn(Optional.empty());

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("ERRO", result.getStatus());
        assertTrue(result.getMensagem().contains("Produto não encontrado"));
    }

    @Test
    void subtrairQuantidade_deveSubtrairComSucesso() {
        String[] parts = {"SubtrairQuantidade", "Notebook", "3"};
        when(produtoRepository.findByNome("Notebook")).thenReturn(Optional.of(produtoExistente));
        when(produtoRepository.save(any(Produto.class))).thenReturn(produtoExistente);

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("OK", result.getStatus());
        assertTrue(result.getMensagem().contains("subtraída"));
        assertTrue(result.getMensagem().contains("7"));
    }

    @Test
    void subtrairQuantidade_deveRetornarErroQuantidadeInsuficiente() {
        String[] parts = {"SubtrairQuantidade", "Notebook", "20"};
        when(produtoRepository.findByNome("Notebook")).thenReturn(Optional.of(produtoExistente));

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("ERRO", result.getStatus());
        assertTrue(result.getMensagem().contains("Quantidade insuficiente"));
    }

    @Test
    void processAction_deveRetornarErroAcaoDesconhecida() {
        String[] parts = {"AcaoInvalida", "Notebook"};

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("ERRO", result.getStatus());
        assertTrue(result.getMensagem().contains("Ação desconhecida"));
    }

    @Test
    void processAction_deveRetornarErroLinhaVazia() {
        String[] parts = {""};

        BatchResult result = batchService.processAction(1, parts);

        assertEquals("ERRO", result.getStatus());
        assertTrue(result.getMensagem().contains("vazia"));
    }
}
