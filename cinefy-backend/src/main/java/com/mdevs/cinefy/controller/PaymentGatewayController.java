package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.payment.PaymentGatewayDTO;
import com.mdevs.cinefy.dto.payment.PaymentGatewayListDTO;
import com.mdevs.cinefy.dto.payment.PaymentGatewayStatusRequestDTO;
import com.mdevs.cinefy.dto.payment.PaymentGatewaySummaryDTO;
import com.mdevs.cinefy.service.PaymentGatewayService;
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

@RestController
@RequestMapping("/payment-gateways")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class PaymentGatewayController {

    private final PaymentGatewayService paymentGatewayService;

    @GetMapping
    public ResponseEntity<PaymentGatewayListDTO> getPaymentGateways() {
        return ResponseEntity.ok(paymentGatewayService.getPaymentGateways());
    }

    @PostMapping
    public ResponseEntity<PaymentGatewaySummaryDTO> createPaymentGateway(@Valid @RequestBody PaymentGatewayDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentGatewayService.createPaymentGateway(dto));
    }

    @PutMapping("/{uuid}")
    public ResponseEntity<PaymentGatewaySummaryDTO> updatePaymentGateway(@PathVariable String uuid, @Valid @RequestBody PaymentGatewayDTO dto) {
        return ResponseEntity.ok(paymentGatewayService.updatePaymentGateway(uuid, dto));
    }

    @PostMapping("/{uuid}/status")
    public ResponseEntity<Void> updatePaymentGatewayStatus(@PathVariable String uuid, @Valid @RequestBody PaymentGatewayStatusRequestDTO dto) {
        paymentGatewayService.updatePaymentGatewayStatus(uuid, dto);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{uuid}")
    public ResponseEntity<Void> deletePaymentGateway(@PathVariable String uuid) {
        paymentGatewayService.deletePaymentGateway(uuid);
        return ResponseEntity.noContent().build();
    }
}
