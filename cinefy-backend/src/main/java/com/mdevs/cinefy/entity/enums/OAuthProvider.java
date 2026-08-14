package com.mdevs.cinefy.entity.enums;

import com.mdevs.cinefy.shared.exception.types.BusinessException;

import java.util.Arrays;

public enum OAuthProvider {
    GOOGLE,
    APPLE;

    public static OAuthProvider fromString(String name) {
        return Arrays.stream(values())
                .filter(provider -> provider.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unknown OAuthProvider: " + name));
    }
}
