package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.payment.PaymentCallbackData;
import com.mdevs.cinefy.dto.payment.PaymentGatewaySummaryDTO;
import com.mdevs.cinefy.dto.payment.PaymentRedirectionDTO;
import com.mdevs.cinefy.dto.payment.PaymobIntentionDTO;
import com.mdevs.cinefy.dto.payment.PaymobIntentionRequestDTO;
import com.mdevs.cinefy.dto.payment.PaymobPayResponseDTO;
import com.mdevs.cinefy.dto.payment.TransactionCallbackDTO;
import com.mdevs.cinefy.entity.Booking;
import com.mdevs.cinefy.entity.Client;
import com.mdevs.cinefy.entity.ClientPaymentMethod;
import com.mdevs.cinefy.entity.TmdbMovie;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.payment.PaymobClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentGatewayService paymentGatewayService;

    private final PaymobClient paymobClient;

    public static final String REFERENCE_SEPARATOR = "_";

    private static final int INTENTION_EXPIRATION_SECONDS = 600;

    private static final BigDecimal PIASTRES_PER_POUND = BigDecimal.valueOf(100);

    // ========================= Public API =========================

    public PaymentRedirectionDTO createCheckout(Booking booking) {
        PaymentGatewaySummaryDTO gateway = paymentGatewayService.getActivePaymentGatewayForPayment();
        PaymobIntentionDTO intention = createIntention(booking, gateway);

        return new PaymentRedirectionDTO(paymobClient.getUnifiedCheckoutUrl(gateway.getCredentials(), intention.clientSecret()));
    }

    public PaymobPayResponseDTO payWithSavedCard(Booking booking, ClientPaymentMethod paymentMethod) {
        PaymentGatewaySummaryDTO gateway = paymentGatewayService.getActivePaymentGatewayForPayment();
        PaymobIntentionDTO intention = createIntention(booking, gateway);

        return paymobClient.pay(
                paymentMethod.getToken(),
                intention.paymentKey(),
                gateway.getCredentials());
    }

    public void refundTransaction(String transactionId, long amountCents) {
        PaymentGatewaySummaryDTO gateway = paymentGatewayService.getActivePaymentGatewayForPayment();
        paymobClient.refund(gateway.getCredentials(), transactionId, amountCents);
    }

    public PaymentCallbackData handleCallback(JsonNode payload, String hmac) {
        PaymentGatewaySummaryDTO gateway = paymentGatewayService.getActivePaymentGatewayForPayment();

        return paymobClient.parseCallback(payload, gateway.getCredentials(), hmac);
    }

    public TransactionCallbackDTO handleRedirect(Map<String, String> params) {
        if (params.isEmpty()) {
            return null;
        }

        PaymentGatewaySummaryDTO gateway = paymentGatewayService.getActivePaymentGatewayForPayment();

        return paymobClient.parseRedirect(params, gateway.getCredentials());
    }

    // =========================== Helpers ===========================

    private PaymobIntentionDTO createIntention(Booking booking, PaymentGatewaySummaryDTO gateway) {
        PaymobIntentionRequestDTO request = toIntentionRequest(booking);
        return paymobClient.createIntention(gateway.getCredentials(), gateway.getPaymentChannels(), request);
    }

    private PaymobIntentionRequestDTO toIntentionRequest(Booking booking) {
        long amount = booking.getTotalAmount()
                .multiply(PIASTRES_PER_POUND)
                .longValueExact();

        TmdbMovie movie = booking.getShowtime().getTmdbMovie();
        PaymobIntentionRequestDTO.Item item = new PaymobIntentionRequestDTO.Item(
                movie.getTitle(),
                amount,
                "Tickets: x" + booking.getSeats().size(),
                1,
                movie.getPosterUrl());

        return new PaymobIntentionRequestDTO(
                amount,
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
