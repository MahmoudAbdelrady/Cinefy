package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.payment.PaymentGatewayDTO;
import com.mdevs.cinefy.dto.payment.PaymentGatewaySummaryDTO;
import com.mdevs.cinefy.service.PaymentGatewayService;
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
public class PaymentGatewayController {

    private final PaymentGatewayService paymentGatewayService;

    @PostMapping
    public ResponseEntity<PaymentGatewaySummaryDTO> createPaymentGateway(@Valid @RequestBody PaymentGatewayDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentGatewayService.createPaymentGateway(dto));
    }
}
