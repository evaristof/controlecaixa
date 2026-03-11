package com.produtos.api.service;

import com.produtos.api.dto.BatchResult;
import com.produtos.api.model.Produto;
import com.produtos.api.repository.ProdutoRepository;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class BatchService {

    private final ProdutoRepository produtoRepository;

    public BatchService(ProdutoRepository produtoRepository) {
        this.produtoRepository = produtoRepository;
    }

    public List<BatchResult> processFile(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new IllegalArgumentException("Nome do arquivo não informado");
        }

        String lower = filename.toLowerCase();
        if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
            return processExcel(file);
        } else if (lower.endsWith(".txt") || lower.endsWith(".csv")) {
            return processTxt(file);
        } else {
            throw new IllegalArgumentException("Formato de arquivo não suportado. Use .xlsx, .xls, .txt ou .csv");
        }
    }

    public List<BatchResult> processTxt(MultipartFile file) throws IOException {
        List<BatchResult> results = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            int lineNum = 0;
            while ((line = reader.readLine()) != null) {
                lineNum++;
                line = line.trim();
                if (line.isEmpty()) continue;

                String[] parts = line.split(";");
                results.add(processAction(lineNum, parts));
            }
        }
        return results;
    }

    public List<BatchResult> processExcel(MultipartFile file) throws IOException {
        List<BatchResult> results = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 0; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                List<String> parts = new ArrayList<>();
                for (int j = 0; j < row.getLastCellNum(); j++) {
                    Cell cell = row.getCell(j);
                    parts.add(getCellValueAsString(cell));
                }

                if (parts.isEmpty() || parts.get(0).trim().isEmpty()) continue;

                results.add(processAction(i + 1, parts.toArray(new String[0])));
            }
        }
        return results;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.NUMERIC) {
            double val = cell.getNumericCellValue();
            if (val == Math.floor(val) && !Double.isInfinite(val)) {
                return String.valueOf((long) val);
            }
            return String.valueOf(val);
        }
        return cell.getStringCellValue().trim();
    }

    public BatchResult processAction(int lineNum, String[] parts) {
        if (parts.length == 0 || parts[0].trim().isEmpty()) {
            return new BatchResult(lineNum, "", "ERRO", "Linha vazia ou sem ação definida");
        }

        String action = parts[0].trim();

        try {
            switch (action) {
                case "CadastrarProduto":
                    return cadastrarProduto(lineNum, parts);
                case "AlterarNome":
                    return alterarNome(lineNum, parts);
                case "AlterarDescricao":
                    return alterarDescricao(lineNum, parts);
                case "AlterarPreco":
                    return alterarPreco(lineNum, parts);
                case "AlterarQuantidade":
                    return alterarQuantidade(lineNum, parts);
                case "AlterarProduto":
                    return alterarProduto(lineNum, parts);
                case "SomarQuantidade":
                    return somarQuantidade(lineNum, parts);
                case "SubtrairQuantidade":
                    return subtrairQuantidade(lineNum, parts);
                default:
                    return new BatchResult(lineNum, action, "ERRO", "Ação desconhecida: " + action);
            }
        } catch (Exception e) {
            return new BatchResult(lineNum, action, "ERRO", e.getMessage());
        }
    }

    private BatchResult cadastrarProduto(int lineNum, String[] parts) {
        if (parts.length < 5) {
            return new BatchResult(lineNum, "CadastrarProduto", "ERRO",
                    "Esperado 5 colunas: CadastrarProduto;nome;descricao;preco;quantidade");
        }

        String nome = parts[1].trim();
        String descricao = parts[2].trim();
        BigDecimal preco;
        int quantidade;

        try {
            preco = new BigDecimal(parts[3].trim().replace(",", "."));
        } catch (NumberFormatException e) {
            return new BatchResult(lineNum, "CadastrarProduto", "ERRO", "Preço inválido: " + parts[3].trim());
        }

        try {
            quantidade = Integer.parseInt(parts[4].trim());
        } catch (NumberFormatException e) {
            return new BatchResult(lineNum, "CadastrarProduto", "ERRO", "Quantidade inválida: " + parts[4].trim());
        }

        Produto produto = new Produto(nome, descricao, preco, quantidade);
        produtoRepository.save(produto);
        return new BatchResult(lineNum, "CadastrarProduto", "OK", "Produto '" + nome + "' cadastrado com sucesso");
    }

    private BatchResult alterarNome(int lineNum, String[] parts) {
        if (parts.length < 3) {
            return new BatchResult(lineNum, "AlterarNome", "ERRO",
                    "Esperado 3 colunas: AlterarNome;nomeProduto;novoNome");
        }

        String nomeProduto = parts[1].trim();
        String novoNome = parts[2].trim();

        Optional<Produto> opt = produtoRepository.findByNome(nomeProduto);
        if (opt.isEmpty()) {
            return new BatchResult(lineNum, "AlterarNome", "ERRO", "Produto não encontrado: " + nomeProduto);
        }

        Produto produto = opt.get();
        produto.setNome(novoNome);
        produtoRepository.save(produto);
        return new BatchResult(lineNum, "AlterarNome", "OK",
                "Nome alterado de '" + nomeProduto + "' para '" + novoNome + "'");
    }

    private BatchResult alterarDescricao(int lineNum, String[] parts) {
        if (parts.length < 3) {
            return new BatchResult(lineNum, "AlterarDescricao", "ERRO",
                    "Esperado 3 colunas: AlterarDescricao;nomeProduto;novaDescricao");
        }

        String nomeProduto = parts[1].trim();
        String novaDescricao = parts[2].trim();

        Optional<Produto> opt = produtoRepository.findByNome(nomeProduto);
        if (opt.isEmpty()) {
            return new BatchResult(lineNum, "AlterarDescricao", "ERRO", "Produto não encontrado: " + nomeProduto);
        }

        Produto produto = opt.get();
        produto.setDescricao(novaDescricao);
        produtoRepository.save(produto);
        return new BatchResult(lineNum, "AlterarDescricao", "OK",
                "Descrição de '" + nomeProduto + "' alterada para '" + novaDescricao + "'");
    }

    private BatchResult alterarPreco(int lineNum, String[] parts) {
        if (parts.length < 3) {
            return new BatchResult(lineNum, "AlterarPreco", "ERRO",
                    "Esperado 3 colunas: AlterarPreco;nomeProduto;novoPreco");
        }

        String nomeProduto = parts[1].trim();
        BigDecimal novoPreco;

        try {
            novoPreco = new BigDecimal(parts[2].trim().replace(",", "."));
        } catch (NumberFormatException e) {
            return new BatchResult(lineNum, "AlterarPreco", "ERRO", "Preço inválido: " + parts[2].trim());
        }

        Optional<Produto> opt = produtoRepository.findByNome(nomeProduto);
        if (opt.isEmpty()) {
            return new BatchResult(lineNum, "AlterarPreco", "ERRO", "Produto não encontrado: " + nomeProduto);
        }

        Produto produto = opt.get();
        produto.setPreco(novoPreco);
        produtoRepository.save(produto);
        return new BatchResult(lineNum, "AlterarPreco", "OK",
                "Preço de '" + nomeProduto + "' alterado para R$ " + novoPreco);
    }

    private BatchResult alterarQuantidade(int lineNum, String[] parts) {
        if (parts.length < 3) {
            return new BatchResult(lineNum, "AlterarQuantidade", "ERRO",
                    "Esperado 3 colunas: AlterarQuantidade;nomeProduto;novaQuantidade");
        }

        String nomeProduto = parts[1].trim();
        int novaQuantidade;

        try {
            novaQuantidade = Integer.parseInt(parts[2].trim());
        } catch (NumberFormatException e) {
            return new BatchResult(lineNum, "AlterarQuantidade", "ERRO", "Quantidade inválida: " + parts[2].trim());
        }

        Optional<Produto> opt = produtoRepository.findByNome(nomeProduto);
        if (opt.isEmpty()) {
            return new BatchResult(lineNum, "AlterarQuantidade", "ERRO", "Produto não encontrado: " + nomeProduto);
        }

        Produto produto = opt.get();
        produto.setQuantidade(novaQuantidade);
        produtoRepository.save(produto);
        return new BatchResult(lineNum, "AlterarQuantidade", "OK",
                "Quantidade de '" + nomeProduto + "' alterada para " + novaQuantidade);
    }

    private BatchResult alterarProduto(int lineNum, String[] parts) {
        if (parts.length < 4) {
            return new BatchResult(lineNum, "AlterarProduto", "ERRO",
                    "Esperado 4 colunas: AlterarProduto;nomeProduto;coluna;valor");
        }

        String nomeProduto = parts[1].trim();
        String coluna = parts[2].trim().toLowerCase();
        String valor = parts[3].trim();

        Optional<Produto> opt = produtoRepository.findByNome(nomeProduto);
        if (opt.isEmpty()) {
            return new BatchResult(lineNum, "AlterarProduto", "ERRO", "Produto não encontrado: " + nomeProduto);
        }

        Produto produto = opt.get();

        switch (coluna) {
            case "nome":
                produto.setNome(valor);
                break;
            case "descricao":
                produto.setDescricao(valor);
                break;
            case "preco":
                try {
                    produto.setPreco(new BigDecimal(valor.replace(",", ".")));
                } catch (NumberFormatException e) {
                    return new BatchResult(lineNum, "AlterarProduto", "ERRO", "Preço inválido: " + valor);
                }
                break;
            case "quantidade":
                try {
                    produto.setQuantidade(Integer.parseInt(valor));
                } catch (NumberFormatException e) {
                    return new BatchResult(lineNum, "AlterarProduto", "ERRO", "Quantidade inválida: " + valor);
                }
                break;
            default:
                return new BatchResult(lineNum, "AlterarProduto", "ERRO",
                        "Coluna desconhecida: " + coluna + ". Use: nome, descricao, preco, quantidade");
        }

        produtoRepository.save(produto);
        return new BatchResult(lineNum, "AlterarProduto", "OK",
                "Coluna '" + coluna + "' de '" + nomeProduto + "' alterada para '" + valor + "'");
    }

    private BatchResult somarQuantidade(int lineNum, String[] parts) {
        if (parts.length < 3) {
            return new BatchResult(lineNum, "SomarQuantidade", "ERRO",
                    "Esperado 3 colunas: SomarQuantidade;nomeProduto;valor");
        }

        String nomeProduto = parts[1].trim();
        int valor;

        try {
            valor = Integer.parseInt(parts[2].trim());
        } catch (NumberFormatException e) {
            return new BatchResult(lineNum, "SomarQuantidade", "ERRO", "Valor inválido: " + parts[2].trim());
        }

        Optional<Produto> opt = produtoRepository.findByNome(nomeProduto);
        if (opt.isEmpty()) {
            return new BatchResult(lineNum, "SomarQuantidade", "ERRO", "Produto não encontrado: " + nomeProduto);
        }

        Produto produto = opt.get();
        int novaQtd = produto.getQuantidade() + valor;
        produto.setQuantidade(novaQtd);
        produtoRepository.save(produto);
        return new BatchResult(lineNum, "SomarQuantidade", "OK",
                "Quantidade de '" + nomeProduto + "' somada em " + valor + ". Nova quantidade: " + novaQtd);
    }

    private BatchResult subtrairQuantidade(int lineNum, String[] parts) {
        if (parts.length < 3) {
            return new BatchResult(lineNum, "SubtrairQuantidade", "ERRO",
                    "Esperado 3 colunas: SubtrairQuantidade;nomeProduto;valor");
        }

        String nomeProduto = parts[1].trim();
        int valor;

        try {
            valor = Integer.parseInt(parts[2].trim());
        } catch (NumberFormatException e) {
            return new BatchResult(lineNum, "SubtrairQuantidade", "ERRO", "Valor inválido: " + parts[2].trim());
        }

        Optional<Produto> opt = produtoRepository.findByNome(nomeProduto);
        if (opt.isEmpty()) {
            return new BatchResult(lineNum, "SubtrairQuantidade", "ERRO", "Produto não encontrado: " + nomeProduto);
        }

        Produto produto = opt.get();
        int novaQtd = produto.getQuantidade() - valor;
        if (novaQtd < 0) {
            return new BatchResult(lineNum, "SubtrairQuantidade", "ERRO",
                    "Quantidade insuficiente. Atual: " + produto.getQuantidade() + ", tentou subtrair: " + valor);
        }
        produto.setQuantidade(novaQtd);
        produtoRepository.save(produto);
        return new BatchResult(lineNum, "SubtrairQuantidade", "OK",
                "Quantidade de '" + nomeProduto + "' subtraída em " + valor + ". Nova quantidade: " + novaQtd);
    }
}
