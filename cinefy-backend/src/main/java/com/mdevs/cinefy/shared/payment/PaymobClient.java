package com.mdevs.cinefy.shared.payment;

import com.mdevs.cinefy.dto.payment.TestConnectionRequestDTO;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.ForbiddenException;
import com.mdevs.cinefy.shared.exception.types.UnauthorizedException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymobClient {

    private static final String INTENTION_PATH = "/v1/intention/";

    @Value("${app.paymob.api-base-url}")
    private String apiBaseUrl;

    private final ObjectMapper objectMapper;

    private RestClient restClient;

    @PostConstruct
    private void init() {
        restClient = RestClient.builder()
                .baseUrl(apiBaseUrl)
                .build();
    }

    public void testConnection(TestConnectionRequestDTO dto) {
        try {
            restClient.post()
                    .uri(INTENTION_PATH)
                    .header("Authorization", "Token " + dto.getSecretKey())
                    .header("Content-Type", "application/json")
                    .body(Map.of(
                            "amount", 100,
                            "currency", dto.getCurrency().toUpperCase(),
                            "payment_methods", List.of(dto.getIntegrationId()),
                            "expiration", 60,
                            "billing_data", Map.of(
                                    "first_name", "Cinefy",
                                    "last_name", "ConnectionTest",
                                    "email", "connection-test@cinefy.local",
                                    "phone_number", "+2010xxxxxxxx"
                            )
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException e) {
            log.warn("Paymob connection test failed: status={} body={}", e.getStatusCode(), e.getResponseBodyAsString());
            String message = extractErrorDetail(e.getResponseBodyAsString());
            int status = e.getStatusCode().value();
            if (status == 401) throw new UnauthorizedException(message);
            if (status == 403) throw new ForbiddenException(message);
            throw new BusinessException(message);
        } catch (RestClientException e) {
            log.warn("Paymob connection test failed: {}", e.getMessage());
            throw new IllegalStateException("Could not reach Paymob: " + e.getMessage());
        }
    }

    private String extractErrorDetail(String body) {
        if (body == null || body.isBlank()) return "Paymob rejected the credentials";
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode detail = root.get("detail");
            if (detail != null && detail.isString()) return detail.asString();
        } catch (Exception ignored) {
        }
        return "Paymob rejected the credentials";
    }
}
