package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.auth.ManagementLoginDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/management/auth")
@RequiredArgsConstructor
public class ManagementAuthController {

    @PostMapping("/login")
    public ResponseEntity<Void> login(@Valid @RequestBody ManagementLoginDTO dto) {
        return ResponseEntity.ok().build();
    }
}
