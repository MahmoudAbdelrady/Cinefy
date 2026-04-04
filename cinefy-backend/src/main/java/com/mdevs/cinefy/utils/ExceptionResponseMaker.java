package com.mdevs.cinefy.utils;

import com.mdevs.cinefy.shared.exception.CinefyExceptionResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public final class ExceptionResponseMaker {
    private static final CinefyExceptionResponse cinefyExceptionResponse = new CinefyExceptionResponse();

    public static ResponseEntity<?> makeResponse(String message, HttpStatus status) {
        return makeResponse(message, null, status);
    }

    public static ResponseEntity<?> makeResponse(String message, Object data, HttpStatus status) {
        cinefyExceptionResponse.setMessage(message);
        cinefyExceptionResponse.setData(data);
        return new ResponseEntity<>(cinefyExceptionResponse, status);
    }
}
