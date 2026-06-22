package com.mdevs.cinefy.shared.security;

import org.springframework.security.authentication.AuthenticationManager;

public record CinefyAuthManagers(
        AuthenticationManager management,

        AuthenticationManager client) {
}
