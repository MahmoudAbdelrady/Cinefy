package com.mdevs.cinefy.shared.security;

import com.mdevs.cinefy.entity.enums.UserType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;

@Getter
@RequiredArgsConstructor
public enum AuthContext {

    MANAGEMENT("mgmt", UserType.STAFF_MEMBER),
    CLIENT("client", UserType.CLIENT);

    public static final String HEADER = "X-Auth-Context";

    private static final String ACCESS_TOKEN_SUFFIX = "_accessToken";

    private static final String REFRESH_TOKEN_SUFFIX = "_refreshToken";

    private static final String CSRF_TOKEN_SUFFIX = "_XSRF-TOKEN";

    private final String prefix;

    private final UserType userType;

    // ========================= Public API =========================

    public static AuthContext fromHeader(String value) {
        if (StringUtils.isBlank(value)) {
            return null;
        }
        for (AuthContext context : values()) {
            if (context.name().equalsIgnoreCase(value)) {
                return context;
            }
        }
        return null;
    }

    public String accessTokenCookie() {
        return prefix + ACCESS_TOKEN_SUFFIX;
    }

    public String refreshTokenCookie() {
        return prefix + REFRESH_TOKEN_SUFFIX;
    }

    public String csrfTokenCookie() {
        return prefix + CSRF_TOKEN_SUFFIX;
    }
}
