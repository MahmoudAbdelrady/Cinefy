package com.mdevs.cinefy.utils;

import com.mdevs.cinefy.shared.exception.CinefyExceptionResponse;
import com.mdevs.cinefy.shared.exception.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public final class ExceptionResponseMaker {

    public static ResponseEntity<?> makeResponse(String message, HttpStatus status) {
        return makeResponse(message, null, null, status);
    }

    public static ResponseEntity<?> makeResponse(String message, ErrorCode errorCode, HttpStatus status) {
        return makeResponse(message, errorCode, null, status);
    }

    public static ResponseEntity<?> makeResponse(String message, Object data, HttpStatus status) {
        return makeResponse(message, null, data, status);
    }

    public static ResponseEntity<?> makeResponse(String message, ErrorCode errorCode, Object data, HttpStatus status) {
        CinefyExceptionResponse response = new CinefyExceptionResponse();
        response.setMessage(message);
        response.setErrorCode(errorCode);
        response.setData(data);
        return new ResponseEntity<>(response, status);
    }
}
