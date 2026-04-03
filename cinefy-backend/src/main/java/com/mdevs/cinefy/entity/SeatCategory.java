package com.mdevs.cinefy.entity;

import lombok.Getter;

import java.util.Arrays;

@Getter
public enum SeatCategory {
    NORMAL("normal"),
    VIP("vip"),
    AISLE("aisle");

    private final String code;

    SeatCategory(String code) {
        this.code = code;
    }

    public static SeatCategory fromCode(String code) {
        return Arrays.stream(values())
                .filter(category -> category.code.equals(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown SeatCategory code: " + code));
    }
}
