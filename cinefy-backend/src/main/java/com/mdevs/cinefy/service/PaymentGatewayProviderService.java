package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.payment.GatewayProviderChannelConfig;
import com.mdevs.cinefy.dto.payment.GatewayProviderCredentials;
import com.mdevs.cinefy.dto.payment.GatewayProviderSpec;
import com.mdevs.cinefy.dto.payment.PaymentGatewayProviderChannel;
import com.mdevs.cinefy.dto.payment.PaymentGatewayProviderDTO;
import com.mdevs.cinefy.dto.payment.PaymentGatewayProviderSummaryDTO;
import com.mdevs.cinefy.entity.PaymentGatewayProvider;
import com.mdevs.cinefy.entity.enums.PaymentProvider;
import com.mdevs.cinefy.repository.PaymentGatewayProviderRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.payment.PaymobClient;
import com.mdevs.cinefy.shared.security.CredentialCipher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.ObjectMapper;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentGatewayProviderService {

    private final PaymentGatewayProviderRepository paymentGatewayProviderRepository;

    private final PaymobClient paymobClient;

    private final CredentialCipher credentialCipher;

    private final ObjectMapper objectMapper;

    private static final List<String> SUPPORTED_CHANNEL_CURRENCIES = List.of("EGP", "USD");

    // ========================= Public API =========================

    @Transactional
    public PaymentGatewayProviderSummaryDTO createPaymentGatewayProvider(PaymentGatewayProviderDTO dto) {
        validateGatewayProvider(dto, null);

        PaymentProvider provider = PaymentProvider.fromString(dto.getProvider());
        GatewayProviderSpec spec = provider.getSpec();

        GatewayProviderCredentials credentials = paymobClient.resolveCredentials(
                parseCredentials(dto.getCredentials(), spec), null);

        List<PaymentGatewayProviderChannel<?>> channels = parseChannels(dto.getPaymentChannels(), spec);

        validateChannels(provider, channels);

        PaymentGatewayProvider gatewayProvider = new PaymentGatewayProvider();
        gatewayProvider.setName(dto.getName());
        gatewayProvider.setCode(PaymentGatewayProvider.toCode(dto.getName()));
        gatewayProvider.setProvider(provider);
        gatewayProvider.setActive(false);
        gatewayProvider.setCredentials(credentialCipher.encrypt(writeJson(credentials)));
        gatewayProvider.setPaymentChannels(writeJson(channels));

        paymentGatewayProviderRepository.save(gatewayProvider);

        return toSummaryDTO(gatewayProvider, paymobClient.readCredentials(credentials, false), channels);
    }

    // =========================== Helpers ===========================

    private void validateGatewayProvider(PaymentGatewayProviderDTO dto, Long excludeId) {
        String code = PaymentGatewayProvider.toCode(dto.getName());
        boolean exists = excludeId == null
                ? paymentGatewayProviderRepository.existsByCode(code)
                : paymentGatewayProviderRepository.existsByCodeAndIdNot(code, excludeId);

        if (exists) {
            throw new BusinessException("A payment gateway with a similar name to '" + dto.getName() + "' already exists");
        }
    }

    private void validateChannels(PaymentProvider provider, List<PaymentGatewayProviderChannel<?>> channels) {
        GatewayProviderSpec spec = provider.getSpec();
        boolean hasChannels = channels != null && !channels.isEmpty();

        if (!spec.supportsChannels()) {
            if (hasChannels) {
                throw new BusinessException(provider.name() + " does not support payment channels");
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

        for (PaymentGatewayProviderChannel<?> channel : channels) {
            if (StringUtils.isEmpty(channel.name())) {
                throw new BusinessException("Channel name is required");
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

    private GatewayProviderCredentials parseCredentials(Object credentials, GatewayProviderSpec spec) {
        return convertJson(credentials, objectMapper.getTypeFactory().constructType(spec.credentialsType()));
    }

    private GatewayProviderCredentials readStoredCredentials(PaymentGatewayProvider gatewayProvider) {
        GatewayProviderSpec spec = gatewayProvider.getProvider().getSpec();
        String decrypted = credentialCipher.decrypt(gatewayProvider.getCredentials());

        return readJson(decrypted, objectMapper.getTypeFactory().constructType(spec.credentialsType()));
    }

    private List<PaymentGatewayProviderChannel<?>> parseChannels(Object channels, GatewayProviderSpec spec) {
        if (channels == null) {
            return List.of();
        }

        JavaType channelType = objectMapper.getTypeFactory()
                .constructParametricType(PaymentGatewayProviderChannel.class, spec.channelConfigType());

        return convertJson(channels, objectMapper.getTypeFactory().constructCollectionType(List.class, channelType));
    }

    private PaymentGatewayProviderSummaryDTO toSummaryDTO(PaymentGatewayProvider gatewayProvider, GatewayProviderCredentials credentials, List<PaymentGatewayProviderChannel<?>> channels) {
        PaymentGatewayProviderSummaryDTO dto = new PaymentGatewayProviderSummaryDTO();
        dto.setId(gatewayProvider.getUuid());
        dto.setName(gatewayProvider.getName());
        dto.setProvider(gatewayProvider.getProvider().name());
        dto.setActive(gatewayProvider.isActive());
        dto.setCredentials(credentials);
        dto.setPaymentChannels(channels);
        dto.setCreatedAt(gatewayProvider.getCreatedAt());
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
