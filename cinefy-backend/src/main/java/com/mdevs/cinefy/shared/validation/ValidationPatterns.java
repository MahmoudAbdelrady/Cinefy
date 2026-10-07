package com.mdevs.cinefy.shared.validation;

public final class ValidationPatterns {

    private ValidationPatterns() {
    }

    public static final String PASSWORD = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$";

    public static final String PASSWORD_MESSAGE =
            "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol";

    public static final String NAME = "^\\p{L}+([ '\\-]\\p{L}+)*$";

    public static final String NAME_MESSAGE = "Name may only contain letters, spaces, hyphens, and apostrophes";

    public static final int NAME_MIN_LENGTH = 2;

    public static final int NAME_MAX_LENGTH = 50;

    public static final String FIRST_NAME_SIZE_MESSAGE = "First name must be {min}-{max} characters";

    public static final String LAST_NAME_SIZE_MESSAGE = "Last name must be {min}-{max} characters";

    public static final String RESOURCE_NAME = "^[A-Za-z0-9]+([ -][A-Za-z0-9]+)*$";

    public static final String RESOURCE_NAME_MESSAGE =
            "Name may only contain letters, numbers, single spaces, and hyphens, with no leading or trailing spaces";

    public static final String ALPHANUMERIC = "^[A-Za-z0-9]+$";

    public static final String EMAIL = "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}$";

    public static final String EMAIL_MESSAGE = "Email must be a valid address";

    public static final String UUID = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
}
