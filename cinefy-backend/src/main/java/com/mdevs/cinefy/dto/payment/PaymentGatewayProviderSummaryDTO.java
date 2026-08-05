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
public class PaymentGatewayProviderSummaryDTO {

    private String id;

    private String name;

    private String provider;

    private boolean active;

    private GatewayProviderCredentials credentials;

    private List<PaymentGatewayProviderChannel<?>> paymentChannels;

    private LocalDateTime createdAt;
}
