package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.client.CurrentClientDTO;
import com.mdevs.cinefy.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/clients")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ClientController {

    private final ClientService clientService;

    @GetMapping("/me")
    public ResponseEntity<CurrentClientDTO> getCurrentClient() {
        return ResponseEntity.ok(clientService.getCurrentClient());
    }
}
