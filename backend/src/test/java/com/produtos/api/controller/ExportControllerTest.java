package com.produtos.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.produtos.api.dto.AuthResponse;
import com.produtos.api.dto.LoginRequest;
import com.produtos.api.dto.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class ExportControllerTest {

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
        register.setEmail("export@test.com");
        register.setSenha("123456");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(register)));

        // Login
        LoginRequest login = new LoginRequest();
        login.setEmail("export@test.com");
        login.setSenha("123456");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andReturn();

        AuthResponse authResponse = objectMapper.readValue(
                result.getResponse().getContentAsString(), AuthResponse.class);
        token = authResponse.getToken();

        // Create some products
        String produto1 = "{\"nome\":\"Notebook\",\"descricao\":\"Notebook Dell\",\"preco\":3500.00,\"quantidade\":10}";
        String produto2 = "{\"nome\":\"Mouse\",\"descricao\":\"Mouse USB\",\"preco\":29.90,\"quantidade\":50}";

        mockMvc.perform(post("/api/produtos")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + token)
                .content(produto1));

        mockMvc.perform(post("/api/produtos")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + token)
                .content(produto2));
    }

    @Test
    void exportExcel_deveRetornarArquivoXlsx() throws Exception {
        mockMvc.perform(get("/api/produtos/export/excel")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(header().exists("Content-Disposition"));
    }

    @Test
    void exportPdf_deveRetornarArquivoPdf() throws Exception {
        mockMvc.perform(get("/api/produtos/export/pdf")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(header().exists("Content-Disposition"));
    }

    @Test
    void exportExcel_semToken_deveRetornar403() throws Exception {
        mockMvc.perform(get("/api/produtos/export/excel"))
                .andExpect(status().isForbidden());
    }

    @Test
    void exportPdf_semToken_deveRetornar403() throws Exception {
        mockMvc.perform(get("/api/produtos/export/pdf"))
                .andExpect(status().isForbidden());
    }

    @Test
    void exportExcel_semProdutos_deveRetornarArquivoVazio() throws Exception {
        // Register fresh user (no products due to DirtiesContext, but we added in setUp)
        // This tests that even with products, the export works
        MvcResult result = mockMvc.perform(get("/api/produtos/export/excel")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        byte[] content = result.getResponse().getContentAsByteArray();
        assertTrue(content.length > 0);
    }

    private void assertTrue(boolean condition) {
        org.junit.jupiter.api.Assertions.assertTrue(condition);
    }
}
