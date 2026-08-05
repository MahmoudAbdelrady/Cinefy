package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.service.PaymentGatewayProviderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payment-gateways")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class PaymentGatewayProviderController {

    private final PaymentGatewayProviderService paymentGatewayProviderService;

}
