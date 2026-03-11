package com.produtos.api.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.produtos.api.model.Produto;
import com.produtos.api.repository.ProdutoRepository;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class ExportService {

    private final ProdutoRepository produtoRepository;

    public ExportService(ProdutoRepository produtoRepository) {
        this.produtoRepository = produtoRepository;
    }

    public byte[] exportToExcel() throws IOException {
        List<Produto> produtos = produtoRepository.findAll();

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Produtos");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            // Header row
            Row headerRow = sheet.createRow(0);
            String[] columns = {"ID", "Nome", "Descrição", "Preço", "Quantidade"};
            for (int i = 0; i < columns.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowIdx = 1;
            for (Produto produto : produtos) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(produto.getId());
                row.createCell(1).setCellValue(produto.getNome());
                row.createCell(2).setCellValue(produto.getDescricao() != null ? produto.getDescricao() : "");
                row.createCell(3).setCellValue(produto.getPreco().doubleValue());
                row.createCell(4).setCellValue(produto.getQuantidade());
            }

            // Auto-size columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportToPdf() throws IOException {
        List<Produto> produtos = produtoRepository.findAll();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            // Title
            Paragraph title = new Paragraph("Relatório de Produtos")
                    .setFontSize(18)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            // Table
            Table table = new Table(UnitValue.createPercentArray(new float[]{1, 3, 3, 2, 2}))
                    .useAllAvailableWidth();

            // Header
            String[] headers = {"ID", "Nome", "Descrição", "Preço", "Quantidade"};
            for (String header : headers) {
                Cell cell = new Cell().add(new Paragraph(header).setBold());
                table.addHeaderCell(cell);
            }

            // Data
            for (Produto produto : produtos) {
                table.addCell(new Cell().add(new Paragraph(String.valueOf(produto.getId()))));
                table.addCell(new Cell().add(new Paragraph(produto.getNome())));
                table.addCell(new Cell().add(new Paragraph(produto.getDescricao() != null ? produto.getDescricao() : "")));
                table.addCell(new Cell().add(new Paragraph("R$ " + produto.getPreco().toString())));
                table.addCell(new Cell().add(new Paragraph(String.valueOf(produto.getQuantidade()))));
            }

            document.add(table);
            document.close();

            return out.toByteArray();
        }
    }
}
