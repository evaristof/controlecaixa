package com.produtos.api.dto;

import com.produtos.api.model.Comanda;
import com.produtos.api.model.ComandaItem;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class ComandaDTO {

    private Long id;
    private Long clienteId;
    private String clienteNome;
    private String clienteDocumento;
    private Long usuarioId;
    private String usuarioNome;
    private LocalDateTime dataAbertura;
    private LocalDateTime dataCheckout;
    private String status;
    private List<ComandaItemDTO> itens;
    private BigDecimal total;

    public ComandaDTO() {}

    public ComandaDTO(Comanda comanda) {
        this.id = comanda.getId();
        this.clienteId = comanda.getCliente().getId();
        this.clienteNome = comanda.getCliente().getNome();
        this.clienteDocumento = comanda.getCliente().getDocumento();
        this.usuarioId = comanda.getUsuario().getId();
        this.usuarioNome = comanda.getUsuario().getNome();
        this.dataAbertura = comanda.getDataAbertura();
        this.dataCheckout = comanda.getDataCheckout();
        this.status = comanda.getStatus().name();
        this.itens = comanda.getItens().stream()
                .map(ComandaItemDTO::new)
                .collect(Collectors.toList());
        this.total = comanda.getItens().stream()
                .map(item -> item.getPrecoUnitario().multiply(BigDecimal.valueOf(item.getQuantidade())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }

    public String getClienteNome() { return clienteNome; }
    public void setClienteNome(String clienteNome) { this.clienteNome = clienteNome; }

    public String getClienteDocumento() { return clienteDocumento; }
    public void setClienteDocumento(String clienteDocumento) { this.clienteDocumento = clienteDocumento; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public String getUsuarioNome() { return usuarioNome; }
    public void setUsuarioNome(String usuarioNome) { this.usuarioNome = usuarioNome; }

    public LocalDateTime getDataAbertura() { return dataAbertura; }
    public void setDataAbertura(LocalDateTime dataAbertura) { this.dataAbertura = dataAbertura; }

    public LocalDateTime getDataCheckout() { return dataCheckout; }
    public void setDataCheckout(LocalDateTime dataCheckout) { this.dataCheckout = dataCheckout; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<ComandaItemDTO> getItens() { return itens; }
    public void setItens(List<ComandaItemDTO> itens) { this.itens = itens; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    // Nested DTO for items
    public static class ComandaItemDTO {
        private Long id;
        private Long produtoId;
        private String produtoNome;
        private Integer quantidade;
        private BigDecimal precoUnitario;
        private BigDecimal subtotal;

        public ComandaItemDTO() {}

        public ComandaItemDTO(ComandaItem item) {
            this.id = item.getId();
            this.produtoId = item.getProduto().getId();
            this.produtoNome = item.getProduto().getNome();
            this.quantidade = item.getQuantidade();
            this.precoUnitario = item.getPrecoUnitario();
            this.subtotal = item.getPrecoUnitario().multiply(BigDecimal.valueOf(item.getQuantidade()));
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Long getProdutoId() { return produtoId; }
        public void setProdutoId(Long produtoId) { this.produtoId = produtoId; }

        public String getProdutoNome() { return produtoNome; }
        public void setProdutoNome(String produtoNome) { this.produtoNome = produtoNome; }

        public Integer getQuantidade() { return quantidade; }
        public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }

        public BigDecimal getPrecoUnitario() { return precoUnitario; }
        public void setPrecoUnitario(BigDecimal precoUnitario) { this.precoUnitario = precoUnitario; }

        public BigDecimal getSubtotal() { return subtotal; }
        public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    }
}
