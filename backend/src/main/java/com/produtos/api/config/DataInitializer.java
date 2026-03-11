package com.produtos.api.config;

import com.produtos.api.model.Cliente;
import com.produtos.api.model.Comanda;
import com.produtos.api.model.ComandaItem;
import com.produtos.api.model.Produto;
import com.produtos.api.model.Usuario;
import com.produtos.api.repository.ClienteRepository;
import com.produtos.api.repository.ComandaRepository;
import com.produtos.api.repository.ProdutoRepository;
import com.produtos.api.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initData(UsuarioRepository usuarioRepository,
                               ProdutoRepository produtoRepository,
                               ClienteRepository clienteRepository,
                               ComandaRepository comandaRepository,
                               PasswordEncoder passwordEncoder) {
        return args -> {
            // === Usuarios ===
            Usuario evaristo;
            String emailGerente = "evaristof@gmail.com";
            if (!usuarioRepository.existsByEmail(emailGerente)) {
                evaristo = new Usuario();
                evaristo.setNome("Evaristo Fernandes de Goes Neto");
                evaristo.setEmail(emailGerente);
                evaristo.setSenha(passwordEncoder.encode("123456"));
                evaristo.setPerfil(Usuario.Perfil.GERENTE);
                evaristo = usuarioRepository.save(evaristo);
                System.out.println("Usuário gerente criado: " + emailGerente);
            } else {
                evaristo = usuarioRepository.findByEmail(emailGerente).orElse(null);
                if (evaristo != null && evaristo.getPerfil() != Usuario.Perfil.GERENTE) {
                    evaristo.setPerfil(Usuario.Perfil.GERENTE);
                    evaristo = usuarioRepository.save(evaristo);
                }
            }

            String emailVendedor = "vendedor@teste.com";
            Usuario vendedor;
            if (!usuarioRepository.existsByEmail(emailVendedor)) {
                vendedor = new Usuario();
                vendedor.setNome("Maria Vendedora");
                vendedor.setEmail(emailVendedor);
                vendedor.setSenha(passwordEncoder.encode("123456"));
                vendedor.setPerfil(Usuario.Perfil.USUARIO);
                vendedor = usuarioRepository.save(vendedor);
                System.out.println("Usuário vendedor criado: " + emailVendedor);
            } else {
                vendedor = usuarioRepository.findByEmail(emailVendedor).orElse(null);
            }

            // === Produtos ===
            Produto notebook;
            Produto mouse;
            Produto teclado;
            Produto fone;

            if (produtoRepository.count() == 0) {
                notebook = new Produto("Notebook Dell", "Notebook Dell Inspiron 15, 8GB RAM, SSD 256GB", new BigDecimal("3499.90"), 10);
                notebook = produtoRepository.save(notebook);

                mouse = new Produto("Mouse Logitech", "Mouse sem fio Logitech M280", new BigDecimal("79.90"), 50);
                mouse = produtoRepository.save(mouse);

                teclado = new Produto("Teclado Mecânico", "Teclado mecânico RGB, switches blue", new BigDecimal("249.90"), 30);
                teclado = produtoRepository.save(teclado);

                Produto monitor = new Produto("Monitor Samsung 24\"", "Monitor Samsung 24 polegadas Full HD IPS", new BigDecimal("899.90"), 15);
                produtoRepository.save(monitor);

                fone = new Produto("Fone Bluetooth JBL", "Fone de ouvido JBL Tune 510BT", new BigDecimal("199.90"), 40);
                fone = produtoRepository.save(fone);

                System.out.println("5 produtos de teste criados");
            } else {
                notebook = produtoRepository.findByNome("Notebook Dell").orElse(null);
                mouse = produtoRepository.findByNome("Mouse Logitech").orElse(null);
                teclado = produtoRepository.findByNome("Teclado Mecânico").orElse(null);
                fone = produtoRepository.findByNome("Fone Bluetooth JBL").orElse(null);
            }

            // === Clientes ===
            Cliente joao = null;
            Cliente ana = null;

            if (clienteRepository.count() == 0) {
                joao = new Cliente();
                joao.setNome("João Silva");
                joao.setEndereco("Rua das Flores, 123 - São Paulo/SP");
                joao.setDocumento("123.456.789-00");
                joao.setTipoDocumento(Cliente.TipoDocumento.CPF);
                joao = clienteRepository.save(joao);

                ana = new Cliente();
                ana.setNome("Ana Santos");
                ana.setEndereco("Av. Paulista, 1000 - São Paulo/SP");
                ana.setDocumento("987.654.321-00");
                ana.setTipoDocumento(Cliente.TipoDocumento.CPF);
                ana = clienteRepository.save(ana);

                Cliente john = new Cliente();
                john.setNome("John Smith");
                john.setEndereco("Rua Augusta, 500 - São Paulo/SP");
                john.setDocumento("AB123456");
                john.setTipoDocumento(Cliente.TipoDocumento.PASSAPORTE);
                clienteRepository.save(john);

                System.out.println("3 clientes de teste criados");
            }

            // === Comandas ===
            if (comandaRepository.count() == 0 && evaristo != null && joao != null && notebook != null) {
                // Comanda aberta para João
                Comanda comanda1 = new Comanda();
                comanda1.setCliente(joao);
                comanda1.setUsuario(evaristo);
                comanda1.setDataAbertura(LocalDateTime.now().minusHours(2));

                ComandaItem item1 = new ComandaItem();
                item1.setComanda(comanda1);
                item1.setProduto(notebook);
                item1.setQuantidade(1);
                item1.setPrecoUnitario(notebook.getPreco());
                comanda1.getItens().add(item1);

                if (mouse != null) {
                    ComandaItem item2 = new ComandaItem();
                    item2.setComanda(comanda1);
                    item2.setProduto(mouse);
                    item2.setQuantidade(2);
                    item2.setPrecoUnitario(mouse.getPreco());
                    comanda1.getItens().add(item2);
                }

                comandaRepository.save(comanda1);

                // Comanda fechada para Ana
                if (ana != null && vendedor != null && teclado != null) {
                    Comanda comanda2 = new Comanda();
                    comanda2.setCliente(ana);
                    comanda2.setUsuario(vendedor);
                    comanda2.setDataAbertura(LocalDateTime.now().minusDays(1));
                    comanda2.setDataCheckout(LocalDateTime.now().minusDays(1).plusHours(1));
                    comanda2.setStatus(Comanda.Status.FECHADA);

                    ComandaItem item3 = new ComandaItem();
                    item3.setComanda(comanda2);
                    item3.setProduto(teclado);
                    item3.setQuantidade(1);
                    item3.setPrecoUnitario(teclado.getPreco());
                    comanda2.getItens().add(item3);

                    if (fone != null) {
                        ComandaItem item4 = new ComandaItem();
                        item4.setComanda(comanda2);
                        item4.setProduto(fone);
                        item4.setQuantidade(1);
                        item4.setPrecoUnitario(fone.getPreco());
                        comanda2.getItens().add(item4);
                    }

                    comandaRepository.save(comanda2);
                }

                System.out.println("2 comandas de teste criadas (1 aberta, 1 fechada)");
            }
        };
    }
}
