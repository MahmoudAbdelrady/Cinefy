package com.mdevs.cinefy.shared.exception.types;

import com.mdevs.cinefy.shared.exception.ErrorCode;
import lombok.Getter;

@Getter
public class ConflictException extends RuntimeException {

    private final ErrorCode errorCode;

    public ConflictException(String message) {
        this(message, null);
    }

    public ConflictException(String message, ErrorCode errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
}
