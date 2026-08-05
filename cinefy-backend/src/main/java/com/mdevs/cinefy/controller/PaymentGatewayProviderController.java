package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.payment.PaymentGatewayProviderDTO;
import com.mdevs.cinefy.dto.payment.PaymentGatewayProviderSummaryDTO;
import com.mdevs.cinefy.service.PaymentGatewayProviderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payment-gateways")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class PaymentGatewayProviderController {

    private final PaymentGatewayProviderService paymentGatewayProviderService;

    @PostMapping
    public ResponseEntity<PaymentGatewayProviderSummaryDTO> createPaymentGatewayProvider(@Valid @RequestBody PaymentGatewayProviderDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentGatewayProviderService.createPaymentGatewayProvider(dto));
    }
}
