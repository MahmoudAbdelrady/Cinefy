package com.mdevs.cinefy.utils;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Set;

public final class HttpUtil {

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");

    private HttpUtil() {
    }

    public static boolean isSafeMethod(HttpServletRequest request) {
        return SAFE_METHODS.contains(request.getMethod());
    }
}
