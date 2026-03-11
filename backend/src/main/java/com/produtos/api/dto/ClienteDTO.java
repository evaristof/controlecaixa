package com.produtos.api.dto;

import com.produtos.api.model.Cliente;

import java.util.Base64;

public class ClienteDTO {

    private Long id;
    private String nome;
    private String endereco;
    private String documento;
    private String tipoDocumento;
    private String fotoBase64;

    public ClienteDTO() {}

    public ClienteDTO(Cliente cliente) {
        this.id = cliente.getId();
        this.nome = cliente.getNome();
        this.endereco = cliente.getEndereco();
        this.documento = cliente.getDocumento();
        this.tipoDocumento = cliente.getTipoDocumento().name();
        if (cliente.getFoto() != null && cliente.getFoto().length > 0) {
            this.fotoBase64 = Base64.getEncoder().encodeToString(cliente.getFoto());
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getEndereco() { return endereco; }
    public void setEndereco(String endereco) { this.endereco = endereco; }

    public String getDocumento() { return documento; }
    public void setDocumento(String documento) { this.documento = documento; }

    public String getTipoDocumento() { return tipoDocumento; }
    public void setTipoDocumento(String tipoDocumento) { this.tipoDocumento = tipoDocumento; }

    public String getFotoBase64() { return fotoBase64; }
    public void setFotoBase64(String fotoBase64) { this.fotoBase64 = fotoBase64; }
}
