package com.produtos.api.dto;

public class BatchResult {

    private int linha;
    private String acao;
    private String status;
    private String mensagem;

    public BatchResult(int linha, String acao, String status, String mensagem) {
        this.linha = linha;
        this.acao = acao;
        this.status = status;
        this.mensagem = mensagem;
    }

    public int getLinha() { return linha; }
    public void setLinha(int linha) { this.linha = linha; }

    public String getAcao() { return acao; }
    public void setAcao(String acao) { this.acao = acao; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMensagem() { return mensagem; }
    public void setMensagem(String mensagem) { this.mensagem = mensagem; }
}
