package com.mdevs.cinefy.shared.payment;

import com.mdevs.cinefy.dto.payment.TestConnectionRequestDTO;
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

    public String testConnection(TestConnectionRequestDTO dto) {
        try {
            restClient.post()
                    .uri(INTENTION_PATH)
                    .header("Authorization", "Token " + dto.getSecretKey())
                    .header("Content-Type", "application/json")
                    .body(Map.of(
                            "amount", 100,
                            "currency", dto.getCurrency().toUpperCase(),
                            "payment_methods", List.of(dto.getIntegrationId())
                    ))
                    .retrieve()
                    .toBodilessEntity();
            return null;
        } catch (HttpClientErrorException e) {
            log.warn("Paymob connection test failed: status={} body={}", e.getStatusCode(), e.getResponseBodyAsString());
            return extractErrorDetail(e.getResponseBodyAsString());
        } catch (RestClientException e) {
            log.warn("Paymob connection test failed: {}", e.getMessage());
            return "Could not reach Paymob: " + e.getMessage();
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
