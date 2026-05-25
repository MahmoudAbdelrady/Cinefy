package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.payment.PaymentMethodDTO;
import com.mdevs.cinefy.dto.payment.PaymentMethodDetailDTO;
import com.mdevs.cinefy.dto.payment.PaymentMethodStatusRequestDTO;
import com.mdevs.cinefy.dto.payment.PaymentMethodSummaryDTO;
import com.mdevs.cinefy.dto.payment.PaymentMethodTestResultDTO;
import com.mdevs.cinefy.dto.payment.TestConnectionRequestDTO;
import com.mdevs.cinefy.service.PaymentMethodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/payment-methods")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;

    @GetMapping
    public ResponseEntity<List<PaymentMethodSummaryDTO>> getPaymentMethods() {
        return ResponseEntity.ok(paymentMethodService.getPaymentMethods());
    }

    @GetMapping("/{uuid}")
    public ResponseEntity<PaymentMethodDetailDTO> getPaymentMethod(@PathVariable String uuid) {
        return ResponseEntity.ok(paymentMethodService.getPaymentMethod(uuid));
    }

    @PostMapping
    public ResponseEntity<PaymentMethodSummaryDTO> createPaymentMethod(@Valid @RequestBody PaymentMethodDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentMethodService.createPaymentMethod(dto));
    }

    @PutMapping("/{uuid}")
    public ResponseEntity<PaymentMethodSummaryDTO> updatePaymentMethod(@PathVariable String uuid, @Valid @RequestBody PaymentMethodDTO dto) {
        return ResponseEntity.ok(paymentMethodService.updatePaymentMethod(uuid, dto));
    }

    @DeleteMapping("/{uuid}")
    public ResponseEntity<Void> deletePaymentMethod(@PathVariable String uuid) {
        paymentMethodService.deletePaymentMethod(uuid);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/test-connection")
    public ResponseEntity<Void> testConnection(@Valid @RequestBody TestConnectionRequestDTO dto) {
        paymentMethodService.testConnection(dto);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{uuid}/test-connection")
    public ResponseEntity<PaymentMethodTestResultDTO> testPaymentMethodConnection(@PathVariable String uuid) {
        return ResponseEntity.ok(paymentMethodService.testPaymentMethodConnection(uuid));
    }

    @PostMapping("/{uuid}/status")
    public ResponseEntity<Void> updatePaymentMethodStatus(@PathVariable String uuid, @Valid @RequestBody PaymentMethodStatusRequestDTO dto) {
        paymentMethodService.updatePaymentMethodStatus(uuid, dto);
        return ResponseEntity.noContent().build();
    }
}
