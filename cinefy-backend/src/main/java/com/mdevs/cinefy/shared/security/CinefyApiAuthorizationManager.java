package com.mdevs.cinefy.shared.security;

import com.mdevs.cinefy.shared.annotation.PublicApi;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.authorization.AuthorizationResult;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.function.Supplier;

@Slf4j
@Component
@RequiredArgsConstructor
public class CinefyApiAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {

    @Qualifier("requestMappingHandlerMapping")
    private final RequestMappingHandlerMapping handlerMapping;

    @Override
    public AuthorizationResult authorize(@NonNull Supplier<? extends Authentication> authentication, @NonNull RequestAuthorizationContext context) {
        if (isPublic(context.getRequest())) {
            return new AuthorizationDecision(true);
        }
        return new AuthorizationDecision(SecurityUtil.isAuthenticated(authentication.get()));
    }

    private boolean isPublic(HttpServletRequest request) {
        try {
            HandlerExecutionChain chain = handlerMapping.getHandler(request);
            if (chain != null && chain.getHandler() instanceof HandlerMethod handlerMethod) {
                return handlerMethod.hasMethodAnnotation(PublicApi.class) || handlerMethod.getBeanType().isAnnotationPresent(PublicApi.class);
            }
        } catch (Exception ex) {
            log.warn("Could not resolve handler for {}, treating as non-public", request.getRequestURI(), ex);
        }
        return false;
    }
}
