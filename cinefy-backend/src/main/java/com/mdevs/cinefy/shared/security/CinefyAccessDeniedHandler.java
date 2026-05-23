package com.mdevs.cinefy.shared.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

/**
 * Returns 403 in the {@code CinefyExceptionResponse} shape when an authenticated user lacks the required authority.
 */
@Component
@RequiredArgsConstructor
public class CinefyAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void handle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull AccessDeniedException ex) throws IOException {
        SecurityResponseWriter.write(response, objectMapper, HttpStatus.FORBIDDEN, "You do not have permission to access this resource");
    }
}
