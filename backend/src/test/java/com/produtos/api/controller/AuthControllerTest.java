package com.produtos.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.produtos.api.dto.LoginRequest;
import com.produtos.api.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private RegisterRequest criarRegisterRequest(String nome, String email, String senha) {
        RegisterRequest request = new RegisterRequest();
        request.setNome(nome);
        request.setEmail(email);
        request.setSenha(senha);
        return request;
    }

    private LoginRequest criarLoginRequest(String email, String senha) {
        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setSenha(senha);
        return request;
    }

    @Test
    void register_deveRetornar201ComToken() throws Exception {
        RegisterRequest request = criarRegisterRequest("Teste", "teste@email.com", "123456");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.nome", is("Teste")))
                .andExpect(jsonPath("$.email", is("teste@email.com")));
    }

    @Test
    void register_deveRetornar409QuandoEmailJaExiste() throws Exception {
        RegisterRequest request = criarRegisterRequest("Teste", "duplicado@email.com", "123456");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Email")));
    }

    @Test
    void register_deveRetornar400QuandoCamposInvalidos() throws Exception {
        RegisterRequest request = criarRegisterRequest("", "", "12");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_deveRetornar200ComToken() throws Exception {
        RegisterRequest registerRequest = criarRegisterRequest("Teste", "login@email.com", "123456");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        LoginRequest loginRequest = criarLoginRequest("login@email.com", "123456");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.nome", is("Teste")))
                .andExpect(jsonPath("$.email", is("login@email.com")));
    }

    @Test
    void login_deveRetornar401ComSenhaErrada() throws Exception {
        RegisterRequest registerRequest = criarRegisterRequest("Teste", "senhaerrada@email.com", "123456");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        LoginRequest loginRequest = criarLoginRequest("senhaerrada@email.com", "senhaerrada");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", containsString("inválidos")));
    }

    @Test
    void login_deveRetornar401ComEmailInexistente() throws Exception {
        LoginRequest loginRequest = criarLoginRequest("naoexiste@email.com", "123456");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", containsString("inválidos")));
    }
}
