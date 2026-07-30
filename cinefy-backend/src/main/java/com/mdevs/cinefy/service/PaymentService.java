package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.payment.PaymentCallbackData;
import com.mdevs.cinefy.dto.payment.PaymentRedirectionDTO;
import com.mdevs.cinefy.dto.payment.PaymobIntentionDTO;
import com.mdevs.cinefy.dto.payment.PaymobIntentionRequestDTO;
import com.mdevs.cinefy.dto.payment.PaymobPayResponseDTO;
import com.mdevs.cinefy.dto.payment.TransactionCallbackDTO;
import com.mdevs.cinefy.entity.Booking;
import com.mdevs.cinefy.entity.Client;
import com.mdevs.cinefy.entity.ClientPaymentMethod;
import com.mdevs.cinefy.entity.PaymentMethod;
import com.mdevs.cinefy.entity.TmdbMovie;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.payment.PaymobClient;
import com.mdevs.cinefy.shared.security.CredentialCipher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentMethodService paymentMethodService;

    private final PaymobClient paymobClient;

    private final CredentialCipher credentialCipher;

    public static final String REFERENCE_SEPARATOR = "_";

    private static final int INTENTION_EXPIRATION_SECONDS = 600;

    private static final BigDecimal PIASTRES_PER_POUND = BigDecimal.valueOf(100);

    // ========================= Public API =========================

    public PaymentRedirectionDTO createCheckout(Booking booking) {
        List<PaymentMethod> activeMethods = findActiveMethods();
        PaymentMethod primaryMethod = activeMethods.getFirst();
        PaymobIntentionDTO intention = createIntention(booking, activeMethods, primaryMethod);

        return new PaymentRedirectionDTO(paymobClient.getUnifiedCheckoutUrl(primaryMethod.getPublicKey(), intention.clientSecret()));
    }

    public PaymobPayResponseDTO payWithSavedCard(Booking booking, ClientPaymentMethod paymentMethod) {
        List<PaymentMethod> activeMethods = findActiveMethods();
        PaymentMethod primaryMethod = activeMethods.getFirst();
        PaymobIntentionDTO intention = createIntention(booking, activeMethods, primaryMethod);

        return paymobClient.pay(
                paymentMethod.getToken(),
                intention.paymentKey(),
                credentialCipher.decrypt(primaryMethod.getHmacKey()));
    }

    public void refundTransaction(String transactionId, long amountCents) {
        PaymentMethod primaryMethod = findActiveMethods().getFirst();
        paymobClient.refund(credentialCipher.decrypt(primaryMethod.getSecretKey()), transactionId, amountCents);
    }

    public PaymentCallbackData handleCallback(JsonNode payload, String hmac) {
        List<PaymentMethod> activeMethods = paymentMethodService.findActiveMethods();
        if (activeMethods.isEmpty()) {
            throw new BusinessException("Online payment is currently unavailable");
        }

        String hmacSecret = credentialCipher.decrypt(activeMethods.getFirst().getHmacKey());
        return paymobClient.parseCallback(payload, hmacSecret, hmac);
    }

    public TransactionCallbackDTO handleRedirect(Map<String, String> params) {
        if (params.isEmpty()) {
            return null;
        }

        String hmacSecret = credentialCipher.decrypt(findActiveMethods().getFirst().getHmacKey());
        return paymobClient.parseRedirect(params, hmacSecret);
    }

    // =========================== Helpers ===========================

    private List<PaymentMethod> findActiveMethods() {
        List<PaymentMethod> activeMethods = paymentMethodService.findActiveMethods();
        if (activeMethods.isEmpty()) {
            throw new BusinessException("Online payment is currently unavailable");
        }
        return activeMethods;
    }

    private PaymobIntentionDTO createIntention(Booking booking, List<PaymentMethod> activeMethods, PaymentMethod primaryMethod) {
        PaymobIntentionRequestDTO request = toIntentionRequest(booking, activeMethods, primaryMethod.getCurrency());
        return paymobClient.createIntention(credentialCipher.decrypt(primaryMethod.getSecretKey()), request);
    }

    private PaymobIntentionRequestDTO toIntentionRequest(Booking booking, List<PaymentMethod> activeMethods, String currency) {
        long amount = booking.getTotalAmount()
                .multiply(PIASTRES_PER_POUND)
                .longValueExact();

        List<Long> integrationIds = activeMethods.stream()
                .map(PaymentMethod::getIntegrationId)
                .toList();

        TmdbMovie movie = booking.getShowtime().getTmdbMovie();
        PaymobIntentionRequestDTO.Item item = new PaymobIntentionRequestDTO.Item(
                movie.getTitle(),
                amount,
                "Tickets: x" + booking.getSeats().size(),
                1,
                movie.getPosterUrl());

        return new PaymobIntentionRequestDTO(
                amount,
                currency,
                integrationIds,
                List.of(item),
                toBillingData(booking.getClient()),
                booking.getUuid() + REFERENCE_SEPARATOR + System.currentTimeMillis(),
                INTENTION_EXPIRATION_SECONDS);
    }

    private PaymobIntentionRequestDTO.BillingData toBillingData(Client client) {
        if (client == null) {
            throw new BusinessException("This booking cannot be paid online");
        }

        return new PaymobIntentionRequestDTO.BillingData(
                client.getFirstName(),
                client.getLastName(),
                "+" + client.getPhoneNumber(),
                client.getEmail());
    }
}
