package com.mdevs.cinefy.shared.exception.types;

public class UnauthorizedException extends RuntimeException {
  public UnauthorizedException(String message) {
    super(message);
  }
}
