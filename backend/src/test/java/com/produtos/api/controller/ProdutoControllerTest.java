package com.produtos.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.produtos.api.dto.AuthResponse;
import com.produtos.api.dto.RegisterRequest;
import com.produtos.api.model.Produto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class ProdutoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setNome("Teste");
        registerRequest.setEmail("teste@email.com");
        registerRequest.setSenha("123456");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse authResponse = objectMapper.readValue(
                result.getResponse().getContentAsString(), AuthResponse.class);
        token = authResponse.getToken();
    }

    private Produto criarProduto(String nome, String descricao, BigDecimal preco, Integer quantidade) {
        return new Produto(nome, descricao, preco, quantidade);
    }

    @Test
    void listarTodos_deveRetornar200ComProdutosSeed() throws Exception {
        mockMvc.perform(get("/api/produtos")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(5))));
    }

    @Test
    void criar_deveRetornar201ComProdutoCriado() throws Exception {
        Produto produto = criarProduto("Notebook", "Notebook Dell", new BigDecimal("3500.00"), 10);

        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(produto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.nome", is("Notebook")))
                .andExpect(jsonPath("$.descricao", is("Notebook Dell")))
                .andExpect(jsonPath("$.preco", is(3500.00)))
                .andExpect(jsonPath("$.quantidade", is(10)));
    }

    @Test
    void criar_deveRetornar400ComDadosInvalidos() throws Exception {
        Produto produto = new Produto();

        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(produto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void buscarPorId_deveRetornar200QuandoExiste() throws Exception {
        Produto produto = criarProduto("Mouse", "Mouse Logitech", new BigDecimal("150.00"), 50);

        MvcResult createResult = mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(produto)))
                .andExpect(status().isCreated())
                .andReturn();

        Produto criado = objectMapper.readValue(createResult.getResponse().getContentAsString(), Produto.class);

        mockMvc.perform(get("/api/produtos/" + criado.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome", is("Mouse")));
    }

    @Test
    void buscarPorId_deveRetornar404QuandoNaoExiste() throws Exception {
        mockMvc.perform(get("/api/produtos/999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void atualizar_deveRetornar200ComProdutoAtualizado() throws Exception {
        Produto produto = criarProduto("Teclado", "Teclado mecânico", new BigDecimal("300.00"), 20);

        MvcResult createResult = mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(produto)))
                .andExpect(status().isCreated())
                .andReturn();

        Produto criado = objectMapper.readValue(createResult.getResponse().getContentAsString(), Produto.class);

        Produto atualizado = criarProduto("Teclado Pro", "Teclado mecânico RGB", new BigDecimal("450.00"), 15);

        mockMvc.perform(put("/api/produtos/" + criado.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(atualizado)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome", is("Teclado Pro")))
                .andExpect(jsonPath("$.descricao", is("Teclado mecânico RGB")))
                .andExpect(jsonPath("$.preco", is(450.00)))
                .andExpect(jsonPath("$.quantidade", is(15)));
    }

    @Test
    void atualizar_deveRetornar404QuandoNaoExiste() throws Exception {
        Produto atualizado = criarProduto("Produto", "Desc", new BigDecimal("100.00"), 1);

        mockMvc.perform(put("/api/produtos/999")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(atualizado)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deletar_deveRetornar204QuandoExiste() throws Exception {
        Produto produto = criarProduto("Monitor", "Monitor 24''", new BigDecimal("1200.00"), 5);

        MvcResult createResult = mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(produto)))
                .andExpect(status().isCreated())
                .andReturn();

        Produto criado = objectMapper.readValue(createResult.getResponse().getContentAsString(), Produto.class);

        mockMvc.perform(delete("/api/produtos/" + criado.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/produtos/" + criado.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void deletar_deveRetornar404QuandoNaoExiste() throws Exception {
        mockMvc.perform(delete("/api/produtos/999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void criar_deveRetornar201ComQuantidadeZero() throws Exception {
        Produto produto = criarProduto("Produto Esgotado", "Sem estoque", new BigDecimal("50.00"), 0);

        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(produto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome", is("Produto Esgotado")))
                .andExpect(jsonPath("$.quantidade", is(0)));
    }

    @Test
    void criar_deveRetornar400ComQuantidadeNegativa() throws Exception {
        Produto produto = criarProduto("Produto Invalido", "Desc", new BigDecimal("50.00"), -1);

        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(produto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listarTodos_deveRetornar403SemToken() throws Exception {
        mockMvc.perform(get("/api/produtos"))
                .andExpect(status().isForbidden());
    }

    @Test
    void criar_deveRetornar403SemToken() throws Exception {
        Produto produto = criarProduto("Produto", "Desc", new BigDecimal("100.00"), 1);

        mockMvc.perform(post("/api/produtos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(produto)))
                .andExpect(status().isForbidden());
    }

    @Test
    void listarTodos_deveRetornar403ComTokenInvalido() throws Exception {
        mockMvc.perform(get("/api/produtos")
                        .header("Authorization", "Bearer token-invalido"))
                .andExpect(status().isForbidden());
    }
}
