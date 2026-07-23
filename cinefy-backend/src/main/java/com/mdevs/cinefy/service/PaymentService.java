package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.payment.PaymentCheckoutDTO;
import com.mdevs.cinefy.dto.payment.PaymobIntentionDTO;
import com.mdevs.cinefy.dto.payment.PaymobIntentionRequestDTO;
import com.mdevs.cinefy.entity.Booking;
import com.mdevs.cinefy.entity.BookingSeat;
import com.mdevs.cinefy.entity.Client;
import com.mdevs.cinefy.entity.PaymentMethod;
import com.mdevs.cinefy.entity.TmdbMovie;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.payment.PaymobClient;
import com.mdevs.cinefy.shared.security.CredentialCipher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentMethodService paymentMethodService;

    private final PaymobClient paymobClient;

    private final CredentialCipher credentialCipher;

    private static final int INTENTION_EXPIRATION_SECONDS = 600;

    private static final BigDecimal PIASTRES_PER_POUND = BigDecimal.valueOf(100);

    // ========================= Public API =========================

    public PaymentCheckoutDTO createCheckout(Booking booking) {
        List<PaymentMethod> activeMethods = paymentMethodService.findActiveMethods();
        if (activeMethods.isEmpty()) {
            throw new BusinessException("Online payment is currently unavailable");
        }

        PaymentMethod primaryMethod = activeMethods.getFirst();
        PaymobIntentionRequestDTO request = toIntentionRequest(booking, activeMethods, primaryMethod.getCurrency());
        PaymobIntentionDTO intention = paymobClient.createIntention(credentialCipher.decrypt(primaryMethod.getSecretKey()), request);

        return new PaymentCheckoutDTO(paymobClient.getUnifiedCheckoutUrl(primaryMethod.getPublicKey(), intention.clientSecret()));
    }

    // =========================== Helpers ===========================

    private PaymobIntentionRequestDTO toIntentionRequest(Booking booking, List<PaymentMethod> activeMethods, String currency) {
        long amount = booking.getSeats().stream()
                .map(BookingSeat::getTicketPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
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
                booking.getId() + "-" + System.currentTimeMillis(),
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
