package com.produtos.api.service;

import com.produtos.api.model.Comanda;
import com.produtos.api.model.ComandaItem;
import com.produtos.api.model.Produto;
import com.produtos.api.model.Usuario;
import com.produtos.api.repository.ComandaRepository;
import com.produtos.api.repository.ProdutoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ComandaService {

    private final ComandaRepository comandaRepository;
    private final ProdutoRepository produtoRepository;

    public ComandaService(ComandaRepository comandaRepository, ProdutoRepository produtoRepository) {
        this.comandaRepository = comandaRepository;
        this.produtoRepository = produtoRepository;
    }

    public List<Comanda> listarTodas() {
        return comandaRepository.findAll();
    }

    public Optional<Comanda> buscarPorId(Long id) {
        return comandaRepository.findById(id);
    }

    public List<Comanda> buscarPorStatus(Comanda.Status status) {
        return comandaRepository.findByStatus(status);
    }

    public List<Comanda> buscarPorCliente(Long clienteId) {
        return comandaRepository.findByClienteId(clienteId);
    }

    public List<Comanda> buscarPorPeriodo(LocalDateTime inicio, LocalDateTime fim) {
        return comandaRepository.findByDataAberturaBetween(inicio, fim);
    }

    public List<Comanda> buscarPorStatusEPeriodo(Comanda.Status status, LocalDateTime inicio, LocalDateTime fim) {
        return comandaRepository.findByStatusAndDataAberturaBetween(status, inicio, fim);
    }

    public Comanda criar(Comanda comanda) {
        comanda.setDataAbertura(LocalDateTime.now());
        comanda.setStatus(Comanda.Status.ABERTA);
        return comandaRepository.save(comanda);
    }

    @Transactional
    public Optional<Comanda> adicionarItem(Long comandaId, Long produtoId, Integer quantidade) {
        return comandaRepository.findById(comandaId).map(comanda -> {
            if (comanda.getStatus() == Comanda.Status.FECHADA) {
                throw new IllegalStateException("Comanda já está fechada");
            }

            Produto produto = produtoRepository.findById(produtoId)
                    .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado"));

            // Check if item already exists in comanda
            Optional<ComandaItem> existingItem = comanda.getItens().stream()
                    .filter(item -> item.getProduto().getId().equals(produtoId))
                    .findFirst();

            if (existingItem.isPresent()) {
                existingItem.get().setQuantidade(existingItem.get().getQuantidade() + quantidade);
            } else {
                ComandaItem item = new ComandaItem();
                item.setComanda(comanda);
                item.setProduto(produto);
                item.setQuantidade(quantidade);
                item.setPrecoUnitario(produto.getPreco());
                comanda.getItens().add(item);
            }

            return comandaRepository.save(comanda);
        });
    }

    @Transactional
    public Optional<Comanda> removerItem(Long comandaId, Long itemId, Usuario usuario) {
        return comandaRepository.findById(comandaId).map(comanda -> {
            if (comanda.getStatus() == Comanda.Status.FECHADA
                    && usuario.getPerfil() != Usuario.Perfil.GERENTE) {
                throw new IllegalStateException("Apenas gerentes podem alterar comandas fechadas");
            }

            comanda.getItens().removeIf(item -> item.getId().equals(itemId));
            return comandaRepository.save(comanda);
        });
    }

    @Transactional
    public Optional<Comanda> atualizarQuantidadeItem(Long comandaId, Long itemId, Integer novaQuantidade, Usuario usuario) {
        return comandaRepository.findById(comandaId).map(comanda -> {
            if (comanda.getStatus() == Comanda.Status.FECHADA
                    && usuario.getPerfil() != Usuario.Perfil.GERENTE) {
                throw new IllegalStateException("Apenas gerentes podem alterar comandas fechadas");
            }

            comanda.getItens().stream()
                    .filter(item -> item.getId().equals(itemId))
                    .findFirst()
                    .ifPresent(item -> item.setQuantidade(novaQuantidade));

            return comandaRepository.save(comanda);
        });
    }

    @Transactional
    public Optional<Comanda> checkout(Long comandaId) {
        return comandaRepository.findById(comandaId).map(comanda -> {
            if (comanda.getStatus() == Comanda.Status.FECHADA) {
                throw new IllegalStateException("Comanda já está fechada");
            }
            comanda.setStatus(Comanda.Status.FECHADA);
            comanda.setDataCheckout(LocalDateTime.now());
            return comandaRepository.save(comanda);
        });
    }

    @Transactional
    public Optional<Comanda> reabrir(Long comandaId) {
        return comandaRepository.findById(comandaId).map(comanda -> {
            comanda.setStatus(Comanda.Status.ABERTA);
            comanda.setDataCheckout(null);
            return comandaRepository.save(comanda);
        });
    }

    public boolean deletar(Long id) {
        if (comandaRepository.existsById(id)) {
            comandaRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
