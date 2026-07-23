package com.mdevs.cinefy.shared.payment;

import com.mdevs.cinefy.dto.payment.PaymobIntentionDTO;
import com.mdevs.cinefy.dto.payment.PaymobIntentionRequestDTO;
import com.mdevs.cinefy.dto.payment.TestConnectionRequestDTO;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymobClient {

    private static final String INTENTION_PATH = "/v1/intention/";

    private static final String UNIFIED_CHECKOUT_PATH = "/unifiedcheckout/";

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);

    private static final Duration READ_TIMEOUT = Duration.ofSeconds(10);

    @Value("${app.paymob.api-base-url}")
    private String apiBaseUrl;

    private final ObjectMapper objectMapper;

    private RestClient restClient;

    @PostConstruct
    private void init() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(CONNECT_TIMEOUT);
        requestFactory.setReadTimeout(READ_TIMEOUT);

        restClient = RestClient.builder()
                .baseUrl(apiBaseUrl)
                .requestFactory(requestFactory)
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
            String message = extractErrorDetail(e.getResponseBodyAsString(), "Paymob rejected the credentials");
            throw new BusinessException(message);
        } catch (RestClientException e) {
            log.warn("Paymob connection test failed: {}", e.getMessage());
            throw new IllegalStateException("Could not reach Paymob: " + e.getMessage());
        }
    }

    public PaymobIntentionDTO createIntention(String secretKey, PaymobIntentionRequestDTO request) {
        try {
            JsonNode response = restClient.post()
                    .uri(INTENTION_PATH)
                    .header("Authorization", "Token " + secretKey)
                    .header("Content-Type", "application/json")
                    .body(request)
                    .retrieve()
                    .body(JsonNode.class);

            return toIntention(response);
        } catch (HttpClientErrorException e) {
            log.warn("Paymob intention creation failed: status={} body={}", e.getStatusCode(), e.getResponseBodyAsString());
            String message = extractErrorDetail(e.getResponseBodyAsString(), "Paymob rejected the payment request");
            throw new BusinessException(message);
        } catch (RestClientException e) {
            log.warn("Paymob intention creation failed: {}", e.getMessage());
            throw new IllegalStateException("Could not reach Paymob: " + e.getMessage());
        }
    }

    public String getUnifiedCheckoutUrl(String publicKey, String clientSecret) {
        return apiBaseUrl + UNIFIED_CHECKOUT_PATH + "?publicKey=" + publicKey + "&clientSecret=" + clientSecret;
    }

    private String extractErrorDetail(String body, String fallback) {
        if (body == null || body.isBlank()) return fallback;
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode detail = root.get("detail");
            if (detail != null && detail.isString()) return detail.asString();
        } catch (Exception ex) {
            log.warn("Paymob Error: {}", ex.getMessage(), ex);
        }
        return fallback;
    }

    private PaymobIntentionDTO toIntention(JsonNode response) {
        if (response == null) {
            throw new BusinessException("Paymob returned an empty intention response");
        }

        String clientSecret = readString(response, "client_secret");
        String paymentKey = readString(response.path("payment_keys").path(0), "key");
        if (clientSecret == null || paymentKey == null) {
            throw new BusinessException("Paymob returned an incomplete intention response");
        }

        return new PaymobIntentionDTO(paymentKey, clientSecret);
    }

    private String readString(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        String text = value.asString();
        return text.isBlank() ? null : text;
    }
}
