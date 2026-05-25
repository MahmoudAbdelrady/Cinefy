package com.mdevs.cinefy.shared.validation;

public final class ValidationPatterns {

    private ValidationPatterns() {
    }

    public static final String PASSWORD = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$";

    public static final String PASSWORD_MESSAGE =
            "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol";
}
