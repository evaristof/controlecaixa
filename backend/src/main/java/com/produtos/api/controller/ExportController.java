package com.produtos.api.controller;

import com.produtos.api.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/produtos/export")
public class ExportController {

    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    @GetMapping("/excel")
    public ResponseEntity<byte[]> exportExcel() throws IOException {
        byte[] data = exportService.exportToExcel();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "produtos.xlsx");
        headers.setContentLength(data.length);

        return ResponseEntity.ok().headers(headers).body(data);
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf() throws IOException {
        byte[] data = exportService.exportToPdf();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "produtos.pdf");
        headers.setContentLength(data.length);

        return ResponseEntity.ok().headers(headers).body(data);
    }
}
