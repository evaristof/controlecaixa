package com.produtos.api.repository;

import com.produtos.api.model.Comanda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ComandaRepository extends JpaRepository<Comanda, Long> {
    List<Comanda> findByStatus(Comanda.Status status);
    List<Comanda> findByClienteId(Long clienteId);
    List<Comanda> findByDataAberturaBetween(LocalDateTime inicio, LocalDateTime fim);
    List<Comanda> findByStatusAndDataAberturaBetween(Comanda.Status status, LocalDateTime inicio, LocalDateTime fim);
}
