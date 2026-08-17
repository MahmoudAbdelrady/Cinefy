package com.mdevs.cinefy.shared.exception.types;

import com.mdevs.cinefy.shared.exception.ErrorCode;
import lombok.Getter;

@Getter
public class ForbiddenException extends RuntimeException {

    private final ErrorCode errorCode;

    private final Object data;

    public ForbiddenException(String message) {
        this(message, null, null);
    }

    public ForbiddenException(String message, ErrorCode errorCode) {
        this(message, errorCode, null);
    }

    public ForbiddenException(String message, ErrorCode errorCode, Object data) {
        super(message);
        this.errorCode = errorCode;
        this.data = data;
    }
}
