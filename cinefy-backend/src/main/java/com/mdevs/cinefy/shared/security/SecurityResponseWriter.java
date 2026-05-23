package com.mdevs.cinefy.shared.security;

import com.mdevs.cinefy.shared.exception.CinefyExceptionResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NoArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

/**
 * Shared helper for the security entry point / access-denied handler.
 */
@NoArgsConstructor
public final class SecurityResponseWriter {

    public static void write(HttpServletResponse response, ObjectMapper objectMapper, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), new CinefyExceptionResponse(message, null));
    }
}
