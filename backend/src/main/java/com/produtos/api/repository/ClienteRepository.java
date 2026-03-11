package com.produtos.api.repository;

import com.produtos.api.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByDocumento(String documento);
    List<Cliente> findByNomeContainingIgnoreCase(String nome);
    List<Cliente> findByNomeContainingIgnoreCaseOrDocumentoContaining(String nome, String documento);
    boolean existsByDocumento(String documento);
}
