package com.mdevs.cinefy.dto.payment;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PaymentGatewayListDTO(
        PaymentGatewaySummaryDTO active,

        List<PaymentGatewaySummaryDTO> standBy
) {

}
