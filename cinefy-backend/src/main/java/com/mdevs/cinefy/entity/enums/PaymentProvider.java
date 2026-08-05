package com.mdevs.cinefy.entity.enums;

import com.mdevs.cinefy.dto.payment.GatewayProviderSpec;
import com.mdevs.cinefy.dto.payment.PaymobGateway;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import lombok.Getter;

import java.util.Arrays;

@Getter
public enum PaymentProvider {
    PAYMOB(new PaymobGateway());

    private final GatewayProviderSpec spec;

    PaymentProvider(GatewayProviderSpec spec) {
        this.spec = spec;
    }

    public static PaymentProvider fromString(String name) {
        return Arrays.stream(values())
                .filter(provider -> provider.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unknown PaymentProvider: " + name));
    }
}
