package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.payment.PaymentAttemptDTO;
import com.mdevs.cinefy.dto.payment.PaymentCallbackData;
import com.mdevs.cinefy.dto.RedirectionDTO;
import com.mdevs.cinefy.dto.payment.PaymobIntentionDTO;
import com.mdevs.cinefy.dto.payment.PaymobIntentionRequestDTO;
import com.mdevs.cinefy.dto.payment.PaymobPayResponseDTO;
import com.mdevs.cinefy.dto.payment.ResolvedPaymentGateway;
import com.mdevs.cinefy.dto.payment.TransactionCallbackDTO;
import com.mdevs.cinefy.entity.Booking;
import com.mdevs.cinefy.entity.Client;
import com.mdevs.cinefy.entity.ClientPaymentMethod;
import com.mdevs.cinefy.entity.TmdbMovie;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.payment.PaymobClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentGatewayService paymentGatewayService;

    private final PaymobClient paymobClient;

    public static final String REFERENCE_SEPARATOR = "_";

    private static final int GATEWAY_REFERENCE_INDEX = 1;

    private static final int INTENTION_EXPIRATION_SECONDS = 600;

    private static final BigDecimal PIASTRES_PER_POUND = BigDecimal.valueOf(100);

    // ========================= Public API =========================

    public PaymentAttemptDTO createCheckout(Booking booking) {
        ResolvedPaymentGateway gateway = paymentGatewayService.getActivePaymentGatewayForPayment();
        PaymobIntentionDTO intention = createIntention(booking, gateway);

        String checkoutUrl = paymobClient.getUnifiedCheckoutUrl(gateway.credentials(), intention.clientSecret());

        return PaymentAttemptDTO.redirection(gateway.entity(), new RedirectionDTO(checkoutUrl));
    }

    public PaymentAttemptDTO payWithSavedCard(Booking booking, ClientPaymentMethod paymentMethod) {
        ResolvedPaymentGateway gateway = paymentGatewayService.getActivePaymentGatewayForPayment();
        PaymobIntentionDTO intention = createIntention(booking, gateway);

        PaymobPayResponseDTO payment = paymobClient.pay(
                paymentMethod.getToken(),
                intention.paymentKey(),
                gateway.credentials());

        return PaymentAttemptDTO.payment(gateway.entity(), payment);
    }

    public void refundTransaction(String orderReference, String transactionId, long amountCents) {
        ResolvedPaymentGateway gateway = resolveGateway(orderReference);
        paymobClient.refund(gateway.credentials(), transactionId, amountCents);
    }

    public PaymentCallbackData handleCallback(JsonNode payload, String hmac) {
        ResolvedPaymentGateway gateway = resolveGateway(paymobClient.readOrderReference(payload));

        return paymobClient.parseCallback(payload, gateway.credentials(), hmac);
    }

    public TransactionCallbackDTO handleRedirect(Map<String, String> params) {
        if (params.isEmpty()) {
            return null;
        }

        ResolvedPaymentGateway gateway = resolveGateway(paymobClient.readOrderReference(params));

        return paymobClient.parseRedirect(params, gateway.credentials());
    }

    // =========================== Helpers ===========================

    private ResolvedPaymentGateway resolveGateway(String orderReference) {
        String[] segments = StringUtils.split(StringUtils.defaultString(orderReference), REFERENCE_SEPARATOR);

        if (segments.length <= GATEWAY_REFERENCE_INDEX) {
            log.warn("Order reference carries no gateway, falling back to the active one: {}", orderReference);
            return paymentGatewayService.getActivePaymentGatewayForPayment();
        }

        return paymentGatewayService.getPaymentGatewayForPayment(segments[GATEWAY_REFERENCE_INDEX]);
    }

    private PaymobIntentionDTO createIntention(Booking booking, ResolvedPaymentGateway gateway) {
        PaymobIntentionRequestDTO request = toIntentionRequest(booking, gateway);
        return paymobClient.createIntention(gateway.credentials(), gateway.channels(), request);
    }

    private PaymobIntentionRequestDTO toIntentionRequest(Booking booking, ResolvedPaymentGateway gateway) {
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
                booking.getUuid() + REFERENCE_SEPARATOR + gateway.entity().getUuid() + REFERENCE_SEPARATOR + System.currentTimeMillis(),
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
                "customer_email@mail.com"); // placeholder because paymob auto-sends a receipt after payment, which can't be toggled-off
    }
}
