package com.mdevs.cinefy.dto.payment;

public interface GatewayProviderSpec {

    Class<? extends GatewayProviderCredentials> credentialsType();

    Class<? extends GatewayProviderChannelConfig> channelConfigType();

    boolean supportsChannels();

    boolean channelsRequired();
}
