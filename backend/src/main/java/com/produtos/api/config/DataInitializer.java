package com.produtos.api.config;

import com.produtos.api.model.Usuario;
import com.produtos.api.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initUsuarios(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            String email = "evaristof@gmail.com";
            if (!usuarioRepository.existsByEmail(email)) {
                Usuario usuario = new Usuario();
                usuario.setNome("Evaristo Fernandes de Goes Neto");
                usuario.setEmail(email);
                usuario.setSenha(passwordEncoder.encode("123456"));
                usuarioRepository.save(usuario);
                System.out.println("Usuário padrão criado: " + email);
            }
        };
    }
}
