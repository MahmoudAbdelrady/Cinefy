package com.mdevs.cinefy.dto.payment;

import com.fasterxml.jackson.annotation.JsonInclude;

public final class PaymobGateway implements GatewayProviderSpec {

    @Override
    public Class<Credentials> credentialsType() {
        return Credentials.class;
    }

    @Override
    public Class<ChannelConfig> channelConfigType() {
        return ChannelConfig.class;
    }

    @Override
    public boolean supportsChannels() {
        return true;
    }

    @Override
    public boolean channelsRequired() {
        return true;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Credentials(
            String secretKey,

            String publicKey,

            String hmacKey
    ) implements GatewayProviderCredentials {

    }

    public record ChannelConfig(
            long integrationId
    ) implements GatewayProviderChannelConfig {

    }
}
