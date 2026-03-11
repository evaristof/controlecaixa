package com.produtos.api.service;

import com.produtos.api.model.Cliente;
import com.produtos.api.repository.ClienteRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public List<Cliente> listarTodos() {
        return clienteRepository.findAll();
    }

    public Optional<Cliente> buscarPorId(Long id) {
        return clienteRepository.findById(id);
    }

    public Optional<Cliente> buscarPorDocumento(String documento) {
        return clienteRepository.findByDocumento(documento);
    }

    public List<Cliente> buscar(String termo) {
        // Strip separators (dots, dashes, slashes) for document search
        String termoLimpo = termo.replaceAll("[.\\-/]", "");
        // Always search by name and by cleaned document (strips separators from stored docs too)
        List<Cliente> nameResults = clienteRepository.findByNomeContainingIgnoreCase(termo);
        List<Cliente> docResults = clienteRepository.findByDocumentoLimpoContaining(termoLimpo);
        // Merge results without duplicates
        ArrayList<Cliente> results = new ArrayList<>(nameResults);
        for (Cliente c : docResults) {
            if (results.stream().noneMatch(r -> r.getId().equals(c.getId()))) {
                results.add(c);
            }
        }
        return results;
    }

    public Cliente salvar(Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    public Optional<Cliente> atualizar(Long id, Cliente clienteAtualizado) {
        return clienteRepository.findById(id).map(cliente -> {
            cliente.setNome(clienteAtualizado.getNome());
            cliente.setEndereco(clienteAtualizado.getEndereco());
            cliente.setDocumento(clienteAtualizado.getDocumento());
            cliente.setTipoDocumento(clienteAtualizado.getTipoDocumento());
            if (clienteAtualizado.getFoto() != null) {
                cliente.setFoto(clienteAtualizado.getFoto());
            }
            return clienteRepository.save(cliente);
        });
    }

    public boolean deletar(Long id) {
        if (clienteRepository.existsById(id)) {
            clienteRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public boolean existsByDocumento(String documento) {
        return clienteRepository.existsByDocumento(documento);
    }
}
