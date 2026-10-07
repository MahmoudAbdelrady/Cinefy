package com.mdevs.cinefy.shared.ratelimit;

import com.mdevs.cinefy.shared.annotation.RateLimited;
import com.mdevs.cinefy.shared.security.SecurityUtil;
import com.mdevs.cinefy.utils.ExceptionResponseMaker;
import com.mdevs.cinefy.utils.HttpUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private final CinefyRateLimiter rateLimiter;

    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RateLimitPolicy policy = resolvePolicy(request, handlerMethod);
        if (policy == null || policy == RateLimitPolicy.NONE) {
            return true;
        }

        if (rateLimiter.tryConsume(resolveKey(request, handlerMethod), policy)) {
            return true;
        }

        ResponseEntity<?> errorResponse = ExceptionResponseMaker.makeResponse("Too many requests, please try again later", HttpStatus.TOO_MANY_REQUESTS);
        response.setStatus(errorResponse.getStatusCode().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse.getBody()));
        return false;
    }

    private RateLimitPolicy resolvePolicy(HttpServletRequest request, HandlerMethod handlerMethod) {
        if (HttpUtil.isSafeMethod(request)) {
            return null;
        }

        RateLimited methodAnnotation = handlerMethod.getMethodAnnotation(RateLimited.class);
        RateLimited rateLimited = methodAnnotation != null
                ? methodAnnotation
                : handlerMethod.getBeanType().getAnnotation(RateLimited.class);
        return rateLimited != null ? rateLimited.value() : RateLimitPolicy.STANDARD;
    }

    private String resolveKey(HttpServletRequest request, HandlerMethod handlerMethod) {
        String endpoint = handlerMethod.getBeanType().getSimpleName() + "#" + handlerMethod.getMethod().getName();
        String userUuid = SecurityUtil.getCurrentUserUuid();
        return endpoint + ":" + (userUuid != null ? userUuid : request.getRemoteAddr());
    }
}
