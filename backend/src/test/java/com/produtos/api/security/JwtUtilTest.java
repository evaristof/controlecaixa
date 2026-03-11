package com.produtos.api.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() throws Exception {
        jwtUtil = new JwtUtil();

        Field secretField = JwtUtil.class.getDeclaredField("secret");
        secretField.setAccessible(true);
        secretField.set(jwtUtil, "defaultTestSecretKeyParaTestesAutomatizados2024SpringBoot");

        Field expirationField = JwtUtil.class.getDeclaredField("expiration");
        expirationField.setAccessible(true);
        expirationField.set(jwtUtil, 86400000L);
    }

    @Test
    void generateToken_deveRetornarTokenNaoNulo() {
        String token = jwtUtil.generateToken("teste@email.com");

        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void extractEmail_deveRetornarEmailCorreto() {
        String email = "teste@email.com";
        String token = jwtUtil.generateToken(email);

        String extractedEmail = jwtUtil.extractEmail(token);

        assertEquals(email, extractedEmail);
    }

    @Test
    void isTokenValid_deveRetornarTrueParaTokenValido() {
        String token = jwtUtil.generateToken("teste@email.com");

        assertTrue(jwtUtil.isTokenValid(token));
    }

    @Test
    void isTokenValid_deveRetornarFalseParaTokenInvalido() {
        assertFalse(jwtUtil.isTokenValid("token-invalido"));
    }

    @Test
    void isTokenValid_deveRetornarFalseParaTokenExpirado() throws Exception {
        Field expirationField = JwtUtil.class.getDeclaredField("expiration");
        expirationField.setAccessible(true);
        expirationField.set(jwtUtil, -1000L);

        String token = jwtUtil.generateToken("teste@email.com");

        assertFalse(jwtUtil.isTokenValid(token));
    }

    @Test
    void generateToken_deveGerarTokensDiferentesParaEmailsDiferentes() {
        String token1 = jwtUtil.generateToken("user1@email.com");
        String token2 = jwtUtil.generateToken("user2@email.com");

        assertNotEquals(token1, token2);
    }
}
