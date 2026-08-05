package com.mdevs.cinefy.dto.payment;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
public class PaymentGatewaySummaryDTO {

    private String id;

    private String name;

    private String provider;

    private boolean active;

    private GatewayProviderCredentials credentials;

    private List<PaymentGatewayChannel<?>> paymentChannels;

    private LocalDateTime createdAt;
}
