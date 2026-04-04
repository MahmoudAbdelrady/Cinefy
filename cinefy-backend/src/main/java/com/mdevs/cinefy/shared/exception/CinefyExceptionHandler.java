package com.mdevs.cinefy.shared.exception;

import com.mdevs.cinefy.config.general.AppConfig;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import com.mdevs.cinefy.utils.ExceptionResponseMaker;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;

public class CinefyExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<?> handleBusinessException(BusinessException ex) {
        return ExceptionResponseMaker.makeResponse(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<?> handleNotFoundException(NotFoundException ex) {
        return ExceptionResponseMaker.makeResponse(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneralException(Exception exception) {
        return ExceptionResponseMaker.makeResponse(AppConfig.isProductionEnv() ? "Something went wrong" : exception.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
