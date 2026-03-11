package com.produtos.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.produtos.api.dto.AuthResponse;
import com.produtos.api.dto.BatchResult;
import com.produtos.api.dto.LoginRequest;
import com.produtos.api.dto.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class BatchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        // Register user
        RegisterRequest register = new RegisterRequest();
        register.setNome("Test User");
        register.setEmail("batch@test.com");
        register.setSenha("123456");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(register)));

        // Login
        LoginRequest login = new LoginRequest();
        login.setEmail("batch@test.com");
        login.setSenha("123456");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andReturn();

        AuthResponse authResponse = objectMapper.readValue(
                result.getResponse().getContentAsString(), AuthResponse.class);
        token = authResponse.getToken();
    }

    @Test
    void batchUploadTxt_deveCadastrarProdutosComSucesso() throws Exception {
        String content = "CadastrarProduto;Notebook;Notebook Dell;3500.00;10\n"
                + "CadastrarProduto;Mouse;Mouse USB;29.90;50\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "produtos.txt", "text/plain", content.getBytes());

        MvcResult result = mockMvc.perform(multipart("/api/produtos/batch")
                .file(file)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        List<BatchResult> results = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, BatchResult.class));

        assertEquals(2, results.size());
        assertEquals("OK", results.get(0).getStatus());
        assertEquals("OK", results.get(1).getStatus());
    }

    @Test
    void batchUploadTxt_deveAlterarNomeComSucesso() throws Exception {
        // First create a product
        String createContent = "CadastrarProduto;Notebook;Notebook Dell;3500.00;10\n";
        MockMultipartFile createFile = new MockMultipartFile(
                "file", "create.txt", "text/plain", createContent.getBytes());

        mockMvc.perform(multipart("/api/produtos/batch")
                .file(createFile)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Then alter the name
        String alterContent = "AlterarNome;Notebook;Notebook Gamer\n";
        MockMultipartFile alterFile = new MockMultipartFile(
                "file", "alter.txt", "text/plain", alterContent.getBytes());

        MvcResult result = mockMvc.perform(multipart("/api/produtos/batch")
                .file(alterFile)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        List<BatchResult> results = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, BatchResult.class));

        assertEquals(1, results.size());
        assertEquals("OK", results.get(0).getStatus());
        assertTrue(results.get(0).getMensagem().contains("Notebook Gamer"));
    }

    @Test
    void batchUploadTxt_deveSomarQuantidadeComSucesso() throws Exception {
        // Create product
        String createContent = "CadastrarProduto;Notebook;Notebook Dell;3500.00;10\n";
        MockMultipartFile createFile = new MockMultipartFile(
                "file", "create.txt", "text/plain", createContent.getBytes());

        mockMvc.perform(multipart("/api/produtos/batch")
                .file(createFile)
                .header("Authorization", "Bearer " + token));

        // Sum quantity
        String sumContent = "SomarQuantidade;Notebook;5\n";
        MockMultipartFile sumFile = new MockMultipartFile(
                "file", "sum.txt", "text/plain", sumContent.getBytes());

        MvcResult result = mockMvc.perform(multipart("/api/produtos/batch")
                .file(sumFile)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        List<BatchResult> results = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, BatchResult.class));

        assertEquals("OK", results.get(0).getStatus());
        assertTrue(results.get(0).getMensagem().contains("15"));
    }

    @Test
    void batchUploadTxt_deveSubtrairQuantidadeComSucesso() throws Exception {
        // Create product
        String createContent = "CadastrarProduto;Notebook;Notebook Dell;3500.00;10\n";
        MockMultipartFile createFile = new MockMultipartFile(
                "file", "create.txt", "text/plain", createContent.getBytes());

        mockMvc.perform(multipart("/api/produtos/batch")
                .file(createFile)
                .header("Authorization", "Bearer " + token));

        // Subtract quantity
        String subContent = "SubtrairQuantidade;Notebook;3\n";
        MockMultipartFile subFile = new MockMultipartFile(
                "file", "sub.txt", "text/plain", subContent.getBytes());

        MvcResult result = mockMvc.perform(multipart("/api/produtos/batch")
                .file(subFile)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        List<BatchResult> results = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, BatchResult.class));

        assertEquals("OK", results.get(0).getStatus());
        assertTrue(results.get(0).getMensagem().contains("7"));
    }

    @Test
    void batchUploadTxt_deveRetornarErroSubtrairQuantidadeInsuficiente() throws Exception {
        // Create product with quantity 10
        String createContent = "CadastrarProduto;Notebook;Notebook Dell;3500.00;10\n";
        MockMultipartFile createFile = new MockMultipartFile(
                "file", "create.txt", "text/plain", createContent.getBytes());

        mockMvc.perform(multipart("/api/produtos/batch")
                .file(createFile)
                .header("Authorization", "Bearer " + token));

        // Try to subtract more than available
        String subContent = "SubtrairQuantidade;Notebook;20\n";
        MockMultipartFile subFile = new MockMultipartFile(
                "file", "sub.txt", "text/plain", subContent.getBytes());

        MvcResult result = mockMvc.perform(multipart("/api/produtos/batch")
                .file(subFile)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        List<BatchResult> results = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, BatchResult.class));

        assertEquals("ERRO", results.get(0).getStatus());
        assertTrue(results.get(0).getMensagem().contains("insuficiente"));
    }

    @Test
    void batchUploadTxt_deveProcessarMultiplasAcoes() throws Exception {
        String content = "CadastrarProduto;Notebook;Notebook Dell;3500.00;10\n"
                + "CadastrarProduto;Mouse;Mouse USB;29.90;50\n"
                + "AlterarPreco;Notebook;4000.00\n"
                + "SomarQuantidade;Mouse;10\n"
                + "AlterarDescricao;Notebook;Notebook Dell Inspiron\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "batch.txt", "text/plain", content.getBytes());

        MvcResult result = mockMvc.perform(multipart("/api/produtos/batch")
                .file(file)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        List<BatchResult> results = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, BatchResult.class));

        assertEquals(5, results.size());
        for (BatchResult r : results) {
            assertEquals("OK", r.getStatus());
        }
    }

    @Test
    void batchUpload_semToken_deveRetornar403() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.txt", "text/plain", "CadastrarProduto;X;Y;1;1\n".getBytes());

        mockMvc.perform(multipart("/api/produtos/batch").file(file))
                .andExpect(status().isForbidden());
    }

    @Test
    void batchUploadTxt_deveRetornarErroAcaoDesconhecida() throws Exception {
        String content = "AcaoInvalida;Notebook;valor\n";
        MockMultipartFile file = new MockMultipartFile(
                "file", "invalid.txt", "text/plain", content.getBytes());

        MvcResult result = mockMvc.perform(multipart("/api/produtos/batch")
                .file(file)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        List<BatchResult> results = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, BatchResult.class));

        assertEquals("ERRO", results.get(0).getStatus());
        assertTrue(results.get(0).getMensagem().contains("desconhecida"));
    }

    @Test
    void batchUploadTxt_deveAlterarProdutoComSucesso() throws Exception {
        // Create product
        String createContent = "CadastrarProduto;Notebook;Notebook Dell;3500.00;10\n";
        MockMultipartFile createFile = new MockMultipartFile(
                "file", "create.txt", "text/plain", createContent.getBytes());

        mockMvc.perform(multipart("/api/produtos/batch")
                .file(createFile)
                .header("Authorization", "Bearer " + token));

        // Use AlterarProduto to change price
        String alterContent = "AlterarProduto;Notebook;preco;5000.00\n";
        MockMultipartFile alterFile = new MockMultipartFile(
                "file", "alter.txt", "text/plain", alterContent.getBytes());

        MvcResult result = mockMvc.perform(multipart("/api/produtos/batch")
                .file(alterFile)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        List<BatchResult> results = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, BatchResult.class));

        assertEquals("OK", results.get(0).getStatus());
    }
}
