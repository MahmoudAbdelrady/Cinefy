package com.mdevs.cinefy.shared.exception;

import com.mdevs.cinefy.config.general.AppConfig;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.ConflictException;
import com.mdevs.cinefy.shared.exception.types.ForbiddenException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import com.mdevs.cinefy.shared.exception.types.UnauthorizedException;
import com.mdevs.cinefy.utils.ExceptionResponseMaker;
import io.jsonwebtoken.JwtException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@RestControllerAdvice
public class CinefyExceptionHandler {

    private static final Map<String, Integer> CONSTRAINT_PRIORITY = Map.of(
            "NotNull", 0,
            "NotBlank", 0,
            "NotEmpty", 0,
            "Size", 1,
            "Min", 1,
            "Max", 1,
            "DecimalMin", 1,
            "DecimalMax", 1,
            "Pattern", 2
    );
    private static final int DEFAULT_CONSTRAINT_PRIORITY = 3;

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<?> handleBusinessException(BusinessException ex) {
        return ExceptionResponseMaker.makeResponse(ex.getMessage(), ex.getErrorCode(), HttpStatus.UNPROCESSABLE_CONTENT);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<?> handleNotFoundException(NotFoundException ex) {
        return ExceptionResponseMaker.makeResponse(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<?> handleUnauthorizedException(UnauthorizedException ex) {
        return ExceptionResponseMaker.makeResponse(ex.getMessage(), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<?> handleAuthenticationException(AuthenticationException ex) {
        return ExceptionResponseMaker.makeResponse("Invalid email or password", HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(JwtException.class)
    public ResponseEntity<?> handleJwtException(JwtException ex) {
        return ExceptionResponseMaker.makeResponse("Invalid or expired token", HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<?> handleForbiddenException(ForbiddenException ex) {
        return ExceptionResponseMaker.makeResponse(ex.getMessage(), ex.getErrorCode(), ex.getData(), HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(AuthorizationDeniedException.class)
    public ResponseEntity<?> handleAuthorizationDeniedException(AuthorizationDeniedException ex) {
        return ExceptionResponseMaker.makeResponse("You do not have permission to access this resource", HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<?> handleValidationException(BindException exception) {
        Map<String, FieldError> errorsByField = exception.getBindingResult().getAllErrors().stream()
                .map(error -> (FieldError) error)
                .collect(Collectors.toMap(
                        FieldError::getField,
                        Function.identity(),
                        (current, candidate) -> getConstraintPriority(candidate.getCode()) < getConstraintPriority(current.getCode()) ? candidate : current,
                        LinkedHashMap::new
                ));
        List<Map<String, String>> errorsList = errorsByField.values().stream().map(error -> {
            Map<String, String> errorMap = new HashMap<>();
            errorMap.put("field", error.getField());
            errorMap.put("message", error.getDefaultMessage());
            return errorMap;
        }).toList();
        return ExceptionResponseMaker.makeResponse("Validation Error", errorsList, HttpStatus.UNPROCESSABLE_CONTENT);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<?> handleConstraintViolationException(ConstraintViolationException exception) {
        Map<String, ConstraintViolation<?>> violationsByField = exception.getConstraintViolations().stream()
                .collect(Collectors.toMap(
                        CinefyExceptionHandler::getViolationFieldName,
                        Function.identity(),
                        (current, candidate) -> getViolationPriority(candidate) < getViolationPriority(current) ? candidate : current,
                        LinkedHashMap::new
                ));
        List<Map<String, String>> errorsList = violationsByField.entrySet().stream().map(entry -> {
            Map<String, String> errorMap = new HashMap<>();
            errorMap.put("field", entry.getKey());
            errorMap.put("message", entry.getValue().getMessage());
            return errorMap;
        }).toList();
        return ExceptionResponseMaker.makeResponse("Validation Error", errorsList, HttpStatus.UNPROCESSABLE_CONTENT);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleHttpMessageNotReadableException(HttpMessageNotReadableException exception) {
        return ExceptionResponseMaker.makeResponse("Malformed request body", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<?> handleConflictException(ConflictException ex) {
        return ExceptionResponseMaker.makeResponse(ex.getMessage(), ex.getErrorCode(), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrityViolationException(DataIntegrityViolationException exception) {
        return ExceptionResponseMaker.makeResponse("A record with the same unique value already exists", HttpStatus.CONFLICT);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneralException(Exception exception) {
        return ExceptionResponseMaker.makeResponse(AppConfig.isProductionEnv() ? "Something went wrong" : exception.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private static String getViolationFieldName(ConstraintViolation<?> violation) {
        return StreamSupport.stream(violation.getPropertyPath().spliterator(), false)
                .reduce((_, second) -> second)
                .map(Path.Node::getName)
                .orElse(null);
    }

    private static int getViolationPriority(ConstraintViolation<?> violation) {
        return getConstraintPriority(violation.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName());
    }

    private static int getConstraintPriority(String constraintName) {
        return CONSTRAINT_PRIORITY.getOrDefault(constraintName, DEFAULT_CONSTRAINT_PRIORITY);
    }
}
