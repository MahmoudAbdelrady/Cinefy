package com.mdevs.cinefy.entity.enums;

import com.mdevs.cinefy.shared.exception.types.BusinessException;

import java.util.Arrays;

public enum EmploymentType {
    FULL_TIME,
    PART_TIME;

    public static EmploymentType fromString(String name) {
        return Arrays.stream(values())
                .filter(type -> type.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unknown EmploymentType: " + name));
    }
}
