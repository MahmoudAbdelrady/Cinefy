package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.payment.GatewayProviderChannelConfig;
import com.mdevs.cinefy.dto.payment.GatewayProviderCredentials;
import com.mdevs.cinefy.dto.payment.GatewayProviderSpec;
import com.mdevs.cinefy.dto.payment.PaymentGatewayProviderChannel;
import com.mdevs.cinefy.entity.enums.PaymentProvider;
import com.mdevs.cinefy.repository.PaymentGatewayProviderRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentGatewayProviderService {

    private final PaymentGatewayProviderRepository paymentGatewayProviderRepository;

    private final ObjectMapper objectMapper;

    // =========================== Helpers ===========================

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

        for (PaymentGatewayProviderChannel<?> channel : channels) {
            if (StringUtils.isEmpty(channel.name())) {
                throw new BusinessException("Channel name is required");
            }

            if (StringUtils.isEmpty(channel.currency())) {
                throw new BusinessException("Channel currency is required");
            }

            if (channel.providerConfig() == null) {
                throw new BusinessException("Channel configuration is required");
            }
        }
    }

    private GatewayProviderCredentials parseCredentials(String credentials, GatewayProviderSpec spec) {
        return readJson(credentials, objectMapper.getTypeFactory().constructType(spec.credentialsType()));
    }

    private List<PaymentGatewayProviderChannel<?>> parseChannels(String channels, GatewayProviderSpec spec) {
        if (StringUtils.isEmpty(channels)) {
            return List.of();
        }

        JavaType channelType = objectMapper.getTypeFactory()
                .constructParametricType(PaymentGatewayProviderChannel.class, spec.channelConfigType());

        return readJson(channels, objectMapper.getTypeFactory().constructCollectionType(List.class, channelType));
    }

    private <T> T readJson(String json, JavaType type) {
        try {
            return objectMapper.readValue(json, type);
        } catch (JacksonException | IllegalArgumentException e) {
            log.warn("Payment gateway JSON could not be parsed as {}: {}", type, e.getMessage());
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
