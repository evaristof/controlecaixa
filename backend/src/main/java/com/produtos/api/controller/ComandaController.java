package com.produtos.api.controller;

import com.produtos.api.dto.ComandaDTO;
import com.produtos.api.model.Cliente;
import com.produtos.api.model.Comanda;
import com.produtos.api.model.Usuario;
import com.produtos.api.repository.UsuarioRepository;
import com.produtos.api.service.ClienteService;
import com.produtos.api.service.ComandaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/comandas")
public class ComandaController {

    private final ComandaService comandaService;
    private final ClienteService clienteService;
    private final UsuarioRepository usuarioRepository;

    public ComandaController(ComandaService comandaService, ClienteService clienteService, UsuarioRepository usuarioRepository) {
        this.comandaService = comandaService;
        this.clienteService = clienteService;
        this.usuarioRepository = usuarioRepository;
    }

    private Usuario getUsuarioLogado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }

    @GetMapping
    public List<ComandaDTO> listarTodas(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dataInicio,
            @RequestParam(required = false) String dataFim) {

        List<Comanda> comandas;

        if (status != null && dataInicio != null && dataFim != null) {
            Comanda.Status s = Comanda.Status.valueOf(status);
            LocalDateTime inicio = LocalDate.parse(dataInicio).atStartOfDay();
            LocalDateTime fim = LocalDate.parse(dataFim).atTime(LocalTime.MAX);
            comandas = comandaService.buscarPorStatusEPeriodo(s, inicio, fim);
        } else if (status != null) {
            comandas = comandaService.buscarPorStatus(Comanda.Status.valueOf(status));
        } else if (dataInicio != null && dataFim != null) {
            LocalDateTime inicio = LocalDate.parse(dataInicio).atStartOfDay();
            LocalDateTime fim = LocalDate.parse(dataFim).atTime(LocalTime.MAX);
            comandas = comandaService.buscarPorPeriodo(inicio, fim);
        } else {
            comandas = comandaService.listarTodas();
        }

        return comandas.stream()
                .map(ComandaDTO::new)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComandaDTO> buscarPorId(@PathVariable Long id) {
        return comandaService.buscarPorId(id)
                .map(c -> ResponseEntity.ok(new ComandaDTO(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/cliente/{clienteId}")
    public List<ComandaDTO> buscarPorCliente(@PathVariable Long clienteId) {
        return comandaService.buscarPorCliente(clienteId).stream()
                .map(ComandaDTO::new)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Map<String, Object> body) {
        Long clienteId = Long.valueOf(body.get("clienteId").toString());
        Cliente cliente = clienteService.buscarPorId(clienteId).orElse(null);

        if (cliente == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Cliente não encontrado"));
        }

        Usuario usuario = getUsuarioLogado();

        Comanda comanda = new Comanda();
        comanda.setCliente(cliente);
        comanda.setUsuario(usuario);

        Comanda salva = comandaService.criar(comanda);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ComandaDTO(salva));
    }

    @PostMapping("/{id}/itens")
    public ResponseEntity<?> adicionarItem(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Long produtoId = Long.valueOf(body.get("produtoId").toString());
            Integer quantidade = Integer.valueOf(body.get("quantidade").toString());

            return comandaService.adicionarItem(id, produtoId, quantidade)
                    .map(c -> ResponseEntity.ok(new ComandaDTO(c)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/itens/{itemId}")
    public ResponseEntity<?> removerItem(@PathVariable Long id, @PathVariable Long itemId) {
        try {
            Usuario usuario = getUsuarioLogado();
            return comandaService.removerItem(id, itemId, usuario)
                    .map(c -> ResponseEntity.ok(new ComandaDTO(c)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/itens/{itemId}")
    public ResponseEntity<?> atualizarQuantidadeItem(
            @PathVariable Long id, @PathVariable Long itemId,
            @RequestBody Map<String, Object> body) {
        try {
            Integer quantidade = Integer.valueOf(body.get("quantidade").toString());
            Usuario usuario = getUsuarioLogado();
            return comandaService.atualizarQuantidadeItem(id, itemId, quantidade, usuario)
                    .map(c -> ResponseEntity.ok(new ComandaDTO(c)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/checkout")
    public ResponseEntity<?> checkout(@PathVariable Long id) {
        try {
            return comandaService.checkout(id)
                    .map(c -> ResponseEntity.ok(new ComandaDTO(c)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reabrir")
    public ResponseEntity<?> reabrir(@PathVariable Long id) {
        Usuario usuario = getUsuarioLogado();
        if (usuario.getPerfil() != Usuario.Perfil.GERENTE) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Apenas gerentes podem reabrir comandas"));
        }
        return comandaService.reabrir(id)
                .map(c -> ResponseEntity.ok(new ComandaDTO(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        Usuario usuario = getUsuarioLogado();
        if (usuario.getPerfil() != Usuario.Perfil.GERENTE) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Apenas gerentes podem excluir comandas"));
        }
        if (comandaService.deletar(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
