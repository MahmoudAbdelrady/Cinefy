package com.mdevs.cinefy.entity.enums;

import com.mdevs.cinefy.shared.exception.types.BusinessException;

import java.util.Arrays;

public enum OtpType {
    RESET_PASSWORD,
    EMAIL_VERIFICATION;

    public static OtpType fromString(String name) {
        return Arrays.stream(values())
                .filter(type -> type.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unknown OtpType: " + name));
    }
}
