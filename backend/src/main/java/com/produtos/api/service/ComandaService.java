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

            // Validate stock availability
            int disponivel = produto.getQuantidadeDisponivel();
            if (quantidade > disponivel) {
                throw new IllegalStateException("Estoque insuficiente. Disponível: " + disponivel + ", Solicitado: " + quantidade);
            }

            // Reserve stock
            produto.setQuantidadeReservada(produto.getQuantidadeReservada() + quantidade);
            produtoRepository.save(produto);

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

            // Restore reserved stock for removed item
            comanda.getItens().stream()
                    .filter(item -> item.getId().equals(itemId))
                    .findFirst()
                    .ifPresent(item -> {
                        if (comanda.getStatus() == Comanda.Status.ABERTA) {
                            Produto produto = item.getProduto();
                            int reserved = produto.getQuantidadeReservada() - item.getQuantidade();
                            produto.setQuantidadeReservada(Math.max(0, reserved));
                            produtoRepository.save(produto);
                        }
                    });

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

            // Deduct stock and clear reservations for all items
            for (ComandaItem item : comanda.getItens()) {
                Produto produto = item.getProduto();
                // Remove reservation
                int reserved = produto.getQuantidadeReservada() - item.getQuantidade();
                produto.setQuantidadeReservada(Math.max(0, reserved));
                // Deduct from actual stock
                int novaQuantidade = produto.getQuantidade() - item.getQuantidade();
                produto.setQuantidade(Math.max(0, novaQuantidade));
                produtoRepository.save(produto);
            }

            comanda.setStatus(Comanda.Status.FECHADA);
            comanda.setDataCheckout(LocalDateTime.now());
            return comandaRepository.save(comanda);
        });
    }

    @Transactional
    public Optional<Comanda> reabrir(Long comandaId) {
        return comandaRepository.findById(comandaId).map(comanda -> {
            // Restore stock first (undo checkout deduction), then re-reserve
            for (ComandaItem item : comanda.getItens()) {
                Produto produto = item.getProduto();
                // Restore stock that was deducted at checkout
                produto.setQuantidade(produto.getQuantidade() + item.getQuantidade());
                // Re-reserve stock for the reopened comanda
                produto.setQuantidadeReservada(produto.getQuantidadeReservada() + item.getQuantidade());
                produtoRepository.save(produto);
            }

            comanda.setStatus(Comanda.Status.ABERTA);
            comanda.setDataCheckout(null);
            return comandaRepository.save(comanda);
        });
    }

    @Transactional
    public boolean deletar(Long id) {
        Optional<Comanda> opt = comandaRepository.findById(id);
        if (opt.isPresent()) {
            Comanda comanda = opt.get();
            // Restore reserved stock for items in open comandas
            if (comanda.getStatus() == Comanda.Status.ABERTA) {
                for (ComandaItem item : comanda.getItens()) {
                    Produto produto = item.getProduto();
                    int reserved = produto.getQuantidadeReservada() - item.getQuantidade();
                    produto.setQuantidadeReservada(Math.max(0, reserved));
                    produtoRepository.save(produto);
                }
            }
            comandaRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
