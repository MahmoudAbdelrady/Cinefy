package com.mdevs.cinefy.shared.exception.types;

import com.mdevs.cinefy.shared.exception.ErrorCode;
import lombok.Getter;

@Getter
public class ForbiddenException extends RuntimeException {

    private final ErrorCode errorCode;

    public ForbiddenException(String message) {
        this(message, null);
    }

    public ForbiddenException(String message, ErrorCode errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
}
