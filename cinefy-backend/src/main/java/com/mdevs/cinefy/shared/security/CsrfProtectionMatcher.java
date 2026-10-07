package com.mdevs.cinefy.shared.security;

import com.mdevs.cinefy.shared.annotation.PublicApi;
import com.mdevs.cinefy.utils.HttpUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

@Slf4j
@Component
@RequiredArgsConstructor
public class CsrfProtectionMatcher implements RequestMatcher {

    public static final String CSRF_TOKEN_HEADER = "X-XSRF-TOKEN";

    @Qualifier("requestMappingHandlerMapping")
    private final RequestMappingHandlerMapping handlerMapping;

    @Override
    public boolean matches(HttpServletRequest request) {
        if (HttpUtil.isSafeMethod(request)) {
            return false;
        }
        return !isPublic(request);
    }

    private boolean isPublic(HttpServletRequest request) {
        try {
            HandlerExecutionChain chain = handlerMapping.getHandler(request);
            if (chain != null && chain.getHandler() instanceof HandlerMethod handlerMethod) {
                return handlerMethod.hasMethodAnnotation(PublicApi.class) || handlerMethod.getBeanType().isAnnotationPresent(PublicApi.class);
            }
        } catch (Exception ex) {
            log.warn("Could not resolve handler for {}, requiring CSRF protection", request.getRequestURI(), ex);
        }
        return false;
    }
}
