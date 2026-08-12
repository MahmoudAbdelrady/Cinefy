package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.client.CurrentClientDTO;
import com.mdevs.cinefy.dto.client.UpdateClientProfileDTO;
import com.mdevs.cinefy.dto.payment.ClientPaymentMethodDTO;
import com.mdevs.cinefy.service.ClientPaymentMethodService;
import com.mdevs.cinefy.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/clients")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENT')")
public class ClientController {

    private final ClientService clientService;

    private final ClientPaymentMethodService clientPaymentMethodService;

    @GetMapping("/me")
    public ResponseEntity<CurrentClientDTO> getCurrentClient() {
        return ResponseEntity.ok(clientService.getCurrentClient());
    }

    @PutMapping("/me")
    public ResponseEntity<CurrentClientDTO> updateCurrentClient(@Valid @RequestBody UpdateClientProfileDTO dto) {
        return ResponseEntity.ok(clientService.updateCurrentClient(dto));
    }

    @GetMapping("/payment-methods")
    public ResponseEntity<List<ClientPaymentMethodDTO>> getCurrentClientPaymentMethods() {
        return ResponseEntity.ok(clientPaymentMethodService.getCurrentClientPaymentMethods());
    }
}
