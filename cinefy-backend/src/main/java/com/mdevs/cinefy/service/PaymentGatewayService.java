package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.payment.GatewayProviderChannelConfig;
import com.mdevs.cinefy.dto.payment.GatewayProviderCredentials;
import com.mdevs.cinefy.dto.payment.GatewayProviderSpec;
import com.mdevs.cinefy.dto.payment.PaymentGatewayChannel;
import com.mdevs.cinefy.dto.payment.PaymentGatewayDTO;
import com.mdevs.cinefy.dto.payment.PaymentGatewayListDTO;
import com.mdevs.cinefy.dto.payment.PaymentGatewayStatusRequestDTO;
import com.mdevs.cinefy.dto.payment.PaymentGatewaySummaryDTO;
import com.mdevs.cinefy.dto.payment.ResolvedPaymentGateway;
import com.mdevs.cinefy.entity.PaymentGateway;
import com.mdevs.cinefy.entity.enums.PaymentProvider;
import com.mdevs.cinefy.repository.BookingRepository;
import com.mdevs.cinefy.repository.PaymentGatewayRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.ConflictException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import com.mdevs.cinefy.shared.payment.PaymobClient;
import com.mdevs.cinefy.shared.security.CredentialCipher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentGatewayService {

    private final PaymentGatewayRepository paymentGatewayRepository;

    private final BookingRepository bookingRepository;

    private final PaymobClient paymobClient;

    private final CredentialCipher credentialCipher;

    private final ObjectMapper objectMapper;

    private static final List<String> SUPPORTED_CHANNEL_CURRENCIES = List.of("EGP", "USD");

    private static final int MAX_CHANNEL_NAME_LENGTH = 30;

    private static final int SETTLED_BOOKING_RETENTION_DAYS = 14;

    // ========================= Public API =========================

    public PaymentGatewayListDTO getPaymentGateways() {
        PaymentGatewaySummaryDTO active = null;
        List<PaymentGatewaySummaryDTO> standBy = new ArrayList<>();

        for (PaymentGateway gateway : paymentGatewayRepository.findAllByOrderByCreatedAtDesc()) {
            PaymentGatewaySummaryDTO dto = toSummaryDTO(gateway);

            if (gateway.isActive()) {
                active = dto;
            } else {
                standBy.add(dto);
            }
        }

        return new PaymentGatewayListDTO(active, standBy);
    }

    public ResolvedPaymentGateway getActivePaymentGatewayForPayment() {
        PaymentGateway gateway = paymentGatewayRepository.findByActiveTrue()
                .orElseThrow(() -> new BusinessException("Online payment is currently unavailable"));

        List<PaymentGatewayChannel<?>> channels = readStoredChannels(gateway);

        if (!channels.isEmpty() && channels.stream().noneMatch(PaymentGatewayChannel::active)) {
            throw new BusinessException("Online payment is currently unavailable");
        }

        return new ResolvedPaymentGateway(gateway, readStoredCredentials(gateway), channels);
    }

    public ResolvedPaymentGateway getPaymentGatewayForPayment(String uuid) {
        PaymentGateway gateway = findPaymentGateway(uuid);

        return new ResolvedPaymentGateway(gateway, readStoredCredentials(gateway), readStoredChannels(gateway));
    }

    @Transactional
    public PaymentGatewaySummaryDTO createPaymentGateway(PaymentGatewayDTO dto) {
        PaymentGateway gateway = new PaymentGateway();
        gateway.setActive(false);

        return savePaymentGateway(gateway, dto, null, null);
    }

    @Transactional
    public PaymentGatewaySummaryDTO updatePaymentGateway(String uuid, PaymentGatewayDTO dto) {
        PaymentGateway gateway = findPaymentGatewayForUpdate(uuid);

        return savePaymentGateway(gateway, dto, gateway.getId(), readStoredCredentials(gateway));
    }

    @Transactional
    public void updatePaymentGatewayStatus(String uuid, PaymentGatewayStatusRequestDTO dto) {
        PaymentGateway gateway = findPaymentGatewayForUpdate(uuid);

        if (gateway.isActive() == dto.getActive()) {
            throw new BusinessException(gateway.isActive()
                    ? "This payment gateway is already active"
                    : "This payment gateway is already deactivated");
        }

        if (dto.getActive()) {
            paymentGatewayRepository.findByActiveTrue().ifPresent(activeGateway -> {
                activeGateway.setActive(false);
                // Flushed first so the deactivation lands before the new activation
                paymentGatewayRepository.saveAndFlush(activeGateway);
            });
        }

        gateway.setActive(dto.getActive());

        try {
            paymentGatewayRepository.saveAndFlush(gateway);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Another payment gateway was activated at the same time. Please try again");
        }
    }

    @Transactional
    public void deletePaymentGateway(String uuid) {
        PaymentGateway gateway = findPaymentGatewayForUpdate(uuid);

        if (gateway.isActive()) {
            throw new BusinessException("An active payment gateway cannot be deleted");
        }

        LocalDateTime startDate = LocalDateTime.now().minusDays(SETTLED_BOOKING_RETENTION_DAYS);
        if (bookingRepository.existsActivityByGateway(gateway.getId(), startDate)) {
            throw new BusinessException("This payment gateway has a payment in progress or one settled within the last "
                    + SETTLED_BOOKING_RETENTION_DAYS + " days and cannot be deleted yet");
        }

        paymentGatewayRepository.delete(gateway);
    }

    // =========================== Helpers ===========================

    private PaymentGateway findPaymentGateway(String uuid) {
        return paymentGatewayRepository.findByUuid(uuid)
                .orElseThrow(() -> new NotFoundException("Payment gateway not found"));
    }

    private PaymentGateway findPaymentGatewayForUpdate(String uuid) {
        return paymentGatewayRepository.findByUuidForUpdate(uuid)
                .orElseThrow(() -> new NotFoundException("Payment gateway not found"));
    }

    private void validateGateway(PaymentGatewayDTO dto, Long excludeId) {
        String code = PaymentGateway.toCode(dto.getName());
        boolean exists = excludeId == null
                ? paymentGatewayRepository.existsByCode(code)
                : paymentGatewayRepository.existsByCodeAndIdNot(code, excludeId);

        if (exists) {
            throw new BusinessException("A payment gateway with a similar name to '" + dto.getName() + "' already exists");
        }
    }

    private void validateChannels(GatewayProviderSpec spec, List<PaymentGatewayChannel<?>> channels) {
        boolean hasChannels = channels != null && !channels.isEmpty();

        if (!spec.supportsChannels()) {
            if (hasChannels) {
                throw new BusinessException("The selected payment provider does not support payment channels");
            }
            return;
        }

        if (spec.channelsRequired() && !hasChannels) {
            throw new BusinessException("At least one payment channel is required");
        }

        if (!hasChannels) {
            return;
        }

        Set<String> names = new HashSet<>();
        Set<GatewayProviderChannelConfig> configs = new HashSet<>();

        for (PaymentGatewayChannel<?> channel : channels) {
            if (StringUtils.isEmpty(channel.name())) {
                throw new BusinessException("Channel name is required");
            }

            if (channel.name().trim().length() > MAX_CHANNEL_NAME_LENGTH) {
                throw new BusinessException("Channel name must not exceed " + MAX_CHANNEL_NAME_LENGTH + " characters");
            }

            if (StringUtils.isEmpty(channel.currency())) {
                throw new BusinessException("Channel currency is required");
            }

            if (!SUPPORTED_CHANNEL_CURRENCIES.contains(channel.currency())) {
                throw new BusinessException("Unsupported channel currency: " + channel.currency());
            }

            if (channel.providerConfig() == null) {
                throw new BusinessException("Channel configuration is required");
            }

            paymobClient.validateChannelConfig(channel.providerConfig());

            if (!names.add(channel.name().trim().toLowerCase())) {
                throw new BusinessException("Another channel already has the name '" + channel.name() + "'");
            }

            if (!configs.add(channel.providerConfig())) {
                throw new BusinessException("Channel '" + channel.name() + "' has the same configuration as another channel");
            }
        }
    }

    private PaymentGatewaySummaryDTO savePaymentGateway(PaymentGateway gateway, PaymentGatewayDTO dto,
                                                        Long excludeId, GatewayProviderCredentials existingCredentials) {
        validateGateway(dto, excludeId);

        PaymentProvider provider = PaymentProvider.fromString(dto.getProvider());
        GatewayProviderSpec spec = provider.getSpec();

        GatewayProviderCredentials credentials = paymobClient.resolveCredentials(
                parseCredentials(dto.getCredentials(), spec), existingCredentials);

        List<PaymentGatewayChannel<?>> channels = parseChannels(dto.getPaymentChannels(), spec);

        validateChannels(spec, channels);

        gateway.setName(dto.getName());
        gateway.setCode(PaymentGateway.toCode(dto.getName()));
        gateway.setProvider(provider);
        gateway.setCredentials(credentialCipher.encrypt(writeJson(credentials)));
        gateway.setPaymentChannels(writeJson(channels));

        paymentGatewayRepository.save(gateway);

        return toSummaryDTO(gateway, paymobClient.readPublicCredentials(credentials), channels);
    }

    private GatewayProviderCredentials parseCredentials(Object credentials, GatewayProviderSpec spec) {
        return convertJson(credentials, objectMapper.getTypeFactory().constructType(spec.credentialsType()));
    }

    private List<PaymentGatewayChannel<?>> parseChannels(Object channels, GatewayProviderSpec spec) {
        if (channels == null) {
            return List.of();
        }

        JavaType channelType = objectMapper.getTypeFactory()
                .constructParametricType(PaymentGatewayChannel.class, spec.channelConfigType());

        return convertJson(channels, objectMapper.getTypeFactory().constructCollectionType(List.class, channelType));
    }

    private GatewayProviderCredentials readStoredCredentials(PaymentGateway gateway) {
        GatewayProviderSpec spec = gateway.getProvider().getSpec();
        String decrypted = credentialCipher.decrypt(gateway.getCredentials());

        return readJson(decrypted, objectMapper.getTypeFactory().constructType(spec.credentialsType()));
    }

    private List<PaymentGatewayChannel<?>> readStoredChannels(PaymentGateway gateway) {
        if (StringUtils.isEmpty(gateway.getPaymentChannels())) {
            return List.of();
        }

        GatewayProviderSpec spec = gateway.getProvider().getSpec();

        JavaType channelType = objectMapper.getTypeFactory()
                .constructParametricType(PaymentGatewayChannel.class, spec.channelConfigType());

        return readJson(gateway.getPaymentChannels(), objectMapper.getTypeFactory().constructCollectionType(List.class, channelType));
    }

    private PaymentGatewaySummaryDTO toSummaryDTO(PaymentGateway gateway) {
        GatewayProviderCredentials credentials = paymobClient.readPublicCredentials(readStoredCredentials(gateway));

        return toSummaryDTO(gateway, credentials, readStoredChannels(gateway));
    }

    private PaymentGatewaySummaryDTO toSummaryDTO(PaymentGateway gateway, GatewayProviderCredentials credentials, List<PaymentGatewayChannel<?>> channels) {
        PaymentGatewaySummaryDTO dto = new PaymentGatewaySummaryDTO();
        dto.setId(gateway.getUuid());
        dto.setName(gateway.getName());
        dto.setProvider(gateway.getProvider().name());
        dto.setActive(gateway.isActive());
        dto.setCredentials(credentials);
        dto.setPaymentChannels(channels);
        dto.setCreatedAt(gateway.getCreatedAt());
        return dto;
    }

    private <T> T readJson(String json, JavaType type) {
        try {
            return objectMapper.readValue(json, type);
        } catch (JacksonException | IllegalArgumentException e) {
            log.warn("Payment gateway JSON could not be parsed as {}: {}", type, e.getMessage());
            throw new BusinessException("Invalid payment gateway configuration");
        }
    }

    private <T> T convertJson(Object value, JavaType type) {
        try {
            return objectMapper.convertValue(value, type);
        } catch (JacksonException | IllegalArgumentException e) {
            log.warn("Payment gateway payload could not be converted to {}: {}", type, e.getMessage());
            throw new BusinessException("Invalid payment gateway configuration");
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException e) {
            log.warn("Payment gateway JSON could not be serialized: {}", e.getMessage());
            throw new BusinessException("Invalid payment gateway configuration");
        }
    }
}
