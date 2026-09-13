package com.mdevs.cinefy.entity.enums;

import com.mdevs.cinefy.shared.exception.types.BusinessException;
import lombok.Getter;

import java.util.Arrays;

@Getter
public enum EmploymentType {
    FULL_TIME("Full-time"),
    PART_TIME("Part-time");

    private final String displayName;

    EmploymentType(String displayName) {
        this.displayName = displayName;
    }

    public static EmploymentType fromString(String name) {
        return Arrays.stream(values())
                .filter(type -> type.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unknown EmploymentType: " + name));
    }
}
