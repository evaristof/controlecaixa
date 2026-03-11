package com.produtos.api.controller;

import com.produtos.api.dto.ClienteDTO;
import com.produtos.api.model.Cliente;
import com.produtos.api.service.ClienteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @GetMapping
    public List<ClienteDTO> listarTodos() {
        return clienteService.listarTodos().stream()
                .map(ClienteDTO::new)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteDTO> buscarPorId(@PathVariable Long id) {
        return clienteService.buscarPorId(id)
                .map(c -> ResponseEntity.ok(new ClienteDTO(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/buscar")
    public List<ClienteDTO> buscar(@RequestParam String termo) {
        return clienteService.buscar(termo).stream()
                .map(ClienteDTO::new)
                .collect(Collectors.toList());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> criar(
            @RequestParam String nome,
            @RequestParam(required = false) String endereco,
            @RequestParam String documento,
            @RequestParam(defaultValue = "CPF") String tipoDocumento,
            @RequestParam(required = false) MultipartFile foto) throws IOException {

        if (clienteService.existsByDocumento(documento)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Documento já cadastrado"));
        }

        Cliente cliente = new Cliente();
        cliente.setNome(nome);
        cliente.setEndereco(endereco);
        cliente.setDocumento(documento);
        cliente.setTipoDocumento(Cliente.TipoDocumento.valueOf(tipoDocumento));
        if (foto != null && !foto.isEmpty()) {
            cliente.setFoto(foto.getBytes());
        }

        Cliente salvo = clienteService.salvar(cliente);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ClienteDTO(salvo));
    }

    @PostMapping(path = "/json", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> criarJson(@RequestBody Map<String, String> body) {
        String documento = body.get("documento");
        if (documento != null && clienteService.existsByDocumento(documento)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Documento já cadastrado"));
        }

        Cliente cliente = new Cliente();
        cliente.setNome(body.get("nome"));
        cliente.setEndereco(body.get("endereco"));
        cliente.setDocumento(documento);
        cliente.setTipoDocumento(Cliente.TipoDocumento.valueOf(
                body.getOrDefault("tipoDocumento", "CPF")));
        if (body.get("fotoBase64") != null && !body.get("fotoBase64").isEmpty()) {
            cliente.setFoto(Base64.getDecoder().decode(body.get("fotoBase64")));
        }

        Cliente salvo = clienteService.salvar(cliente);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ClienteDTO(salvo));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> atualizar(
            @PathVariable Long id,
            @RequestParam String nome,
            @RequestParam(required = false) String endereco,
            @RequestParam String documento,
            @RequestParam(defaultValue = "CPF") String tipoDocumento,
            @RequestParam(required = false) MultipartFile foto) throws IOException {

        Cliente clienteAtualizado = new Cliente();
        clienteAtualizado.setNome(nome);
        clienteAtualizado.setEndereco(endereco);
        clienteAtualizado.setDocumento(documento);
        clienteAtualizado.setTipoDocumento(Cliente.TipoDocumento.valueOf(tipoDocumento));
        if (foto != null && !foto.isEmpty()) {
            clienteAtualizado.setFoto(foto.getBytes());
        }

        return clienteService.atualizar(id, clienteAtualizado)
                .map(c -> ResponseEntity.ok(new ClienteDTO(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping(value = "/{id}/json", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> atualizarJson(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Cliente clienteAtualizado = new Cliente();
        clienteAtualizado.setNome(body.get("nome"));
        clienteAtualizado.setEndereco(body.get("endereco"));
        clienteAtualizado.setDocumento(body.get("documento"));
        clienteAtualizado.setTipoDocumento(Cliente.TipoDocumento.valueOf(
                body.getOrDefault("tipoDocumento", "CPF")));
        if (body.get("fotoBase64") != null && !body.get("fotoBase64").isEmpty()) {
            clienteAtualizado.setFoto(Base64.getDecoder().decode(body.get("fotoBase64")));
        }

        return clienteService.atualizar(id, clienteAtualizado)
                .map(c -> ResponseEntity.ok(new ClienteDTO(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/foto")
    public ResponseEntity<?> uploadFoto(@PathVariable Long id, @RequestParam MultipartFile foto) throws IOException {
        return clienteService.buscarPorId(id).map(cliente -> {
            try {
                cliente.setFoto(foto.getBytes());
                clienteService.salvar(cliente);
                return ResponseEntity.ok(new ClienteDTO(cliente));
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Erro ao salvar foto"));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/foto")
    public ResponseEntity<byte[]> getFoto(@PathVariable Long id) {
        return clienteService.buscarPorId(id)
                .filter(c -> c.getFoto() != null)
                .map(c -> ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(c.getFoto()))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (clienteService.deletar(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
