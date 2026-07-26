package com.mdevs.cinefy.shared.payment;

import com.mdevs.cinefy.dto.payment.CardTokenCallbackDTO;
import com.mdevs.cinefy.dto.payment.PaymentCallbackData;
import com.mdevs.cinefy.dto.payment.PaymobIntentionDTO;
import com.mdevs.cinefy.dto.payment.PaymobIntentionRequestDTO;
import com.mdevs.cinefy.dto.payment.PaymobPayResponseDTO;
import com.mdevs.cinefy.dto.payment.TestConnectionRequestDTO;
import com.mdevs.cinefy.dto.payment.TransactionCallbackDTO;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymobClient {

    @Value("${app.paymob.api-base-url}")
    private String apiBaseUrl;

    private final ObjectMapper objectMapper;

    private RestClient restClient;

    private static final String INTENTION_PATH = "/v1/intention/";

    private static final String UNIFIED_CHECKOUT_PATH = "/unifiedcheckout/";

    private static final String PAY_PATH = "/api/acceptance/payments/pay";

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);

    private static final Duration READ_TIMEOUT = Duration.ofSeconds(10);

    private static final String HMAC_ALGORITHM = "HmacSHA512";

    private static final String TRANSACTION_TYPE = "TRANSACTION";

    private static final List<String> TRANSACTION_HMAC_FIELDS = List.of(
            "amount_cents",
            "created_at",
            "currency",
            "error_occured",
            "has_parent_transaction",
            "id",
            "integration_id",
            "is_3d_secure",
            "is_auth",
            "is_capture",
            "is_refunded",
            "is_standalone_payment",
            "is_voided",
            "order.id",
            "owner",
            "pending",
            "source_data.pan",
            "source_data.sub_type",
            "source_data.type",
            "success");

    private static final List<String> TOKEN_HMAC_FIELDS = List.of(
            "card_subtype",
            "created_at",
            "email",
            "id",
            "masked_pan",
            "merchant_id",
            "order_id",
            "token");

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

    // ========================= Public API =========================

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

    public PaymobPayResponseDTO pay(String cardToken, String paymentToken, String hmacSecret) {
        try {
            JsonNode response = restClient.post()
                    .uri(PAY_PATH)
                    .header("Content-Type", "application/json")
                    .body(Map.of(
                            "source", Map.of(
                                    "identifier", cardToken,
                                    "subtype", "TOKEN"
                            ),
                            "payment_token", paymentToken
                    ))
                    .retrieve()
                    .body(JsonNode.class);
            if (response == null) {
                throw new BusinessException("Paymob returned an empty payment response");
            }

            verifyHmac(response, TRANSACTION_HMAC_FIELDS, hmacSecret, response.path("hmac").asString(null));

            return toPayResponse(response);
        } catch (HttpClientErrorException e) {
            log.warn("Paymob saved-card payment failed: status={} body={}", e.getStatusCode(), e.getResponseBodyAsString());
            String message = extractErrorDetail(e.getResponseBodyAsString(), "Paymob rejected the payment request");
            throw new BusinessException(message);
        } catch (RestClientException e) {
            log.warn("Paymob saved-card payment failed: {}", e.getMessage());
            throw new IllegalStateException("Could not reach Paymob: " + e.getMessage());
        }
    }

    public String getUnifiedCheckoutUrl(String publicKey, String clientSecret) {
        return apiBaseUrl + UNIFIED_CHECKOUT_PATH + "?publicKey=" + publicKey + "&clientSecret=" + clientSecret;
    }

    public PaymentCallbackData parseCallback(JsonNode payload, String hmacSecret, String receivedHmac) {
        String type = payload.path("type").asString(null);
        JsonNode obj = payload.path("obj");

        boolean isTransaction = TRANSACTION_TYPE.equals(type);

        List<String> fields = isTransaction ? TRANSACTION_HMAC_FIELDS : TOKEN_HMAC_FIELDS;
        verifyHmac(obj, fields, hmacSecret, receivedHmac);

        return isTransaction ? toTransactionCallback(obj) : toCardTokenCallback(obj);
    }

    // =========================== Helpers ===========================

    private void verifyHmac(JsonNode obj, List<String> fields, String hmacSecret, String receivedHmac) {
        if (StringUtils.isEmpty(receivedHmac)) {
            log.warn("Paymob response rejected: no HMAC to verify against");
            throw new BusinessException("Invalid payment signature");
        }

        String concatenated = concatenateHmacFields(obj, fields);
        String expectedHmac = calculateHmac(concatenated, hmacSecret);

        boolean valid = MessageDigest.isEqual(
                expectedHmac.getBytes(StandardCharsets.UTF_8),
                receivedHmac.toLowerCase().getBytes(StandardCharsets.UTF_8));
        if (!valid) {
            log.warn("Paymob response rejected: HMAC mismatch over fields={} concatenated={}", fields, concatenated);
            throw new BusinessException("Invalid payment signature");
        }
    }

    private PaymobIntentionDTO toIntention(JsonNode response) {
        if (response == null) {
            throw new BusinessException("Paymob returned an empty intention response");
        }

        String clientSecret = response.path("client_secret").asString(null);
        String paymentKey = response.path("payment_keys").path(0).path("key").asString(null);
        if (StringUtils.isEmpty(clientSecret) || StringUtils.isEmpty(paymentKey)) {
            throw new BusinessException("Paymob returned an incomplete intention response");
        }

        return new PaymobIntentionDTO(paymentKey, clientSecret);
    }

    private PaymobPayResponseDTO toPayResponse(JsonNode response) {
        String id = response.path("id").asString(null);
        if (StringUtils.isEmpty(id)) {
            throw new BusinessException("Paymob returned an incomplete payment response");
        }

        return new PaymobPayResponseDTO(
                id,
                response.path("pending").asBoolean(false),
                response.path("success").asBoolean(false),
                response.path("data.message").asString(null),
                response.path("redirection_url").asString(null),
                response.path("merchant_order_id").asString(null));
    }

    private TransactionCallbackDTO toTransactionCallback(JsonNode obj) {
        return new TransactionCallbackDTO(
                obj.path("id").asString(null),
                obj.path("success").asBoolean(false),
                obj.path("is_refunded").asBoolean(false),
                obj.path("is_voided").asBoolean(false),
                obj.path("order").path("merchant_order_id").asString(null));
    }

    private CardTokenCallbackDTO toCardTokenCallback(JsonNode obj) {
        return new CardTokenCallbackDTO(
                obj.path("token").asString(null),
                obj.path("masked_pan").asString(null),
                obj.path("card_subtype").asString(null),
                obj.path("email").asString(null));
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

    private String concatenateHmacFields(JsonNode obj, List<String> fields) {
        StringBuilder builder = new StringBuilder();
        for (String field : fields) {
            JsonNode value = resolveHmacField(obj, field);
            if (!value.isMissingNode() && !value.isNull()) {
                builder.append(value.asString());
            }
        }
        return builder.toString();
    }

    private JsonNode resolveHmacField(JsonNode obj, String field) {
        JsonNode literal = obj.path(field);
        if (!literal.isMissingNode()) {
            return literal;
        }

        JsonNode value = obj;
        for (String segment : field.split("\\.")) {
            if (!value.isObject()) {
                return value;
            }
            value = value.path(segment);
        }
        return value;
    }

    private String calculateHmac(String payload, String hmacSecret) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(hmacSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Could not calculate the Paymob callback signature", e);
        }
    }
}
