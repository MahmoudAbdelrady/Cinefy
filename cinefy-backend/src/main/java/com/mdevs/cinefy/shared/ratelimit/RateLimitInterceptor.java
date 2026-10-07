package com.mdevs.cinefy.shared.ratelimit;

import com.mdevs.cinefy.shared.annotation.RateLimited;
import com.mdevs.cinefy.shared.security.SecurityUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private final CinefyRateLimiter rateLimiter;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RateLimited rateLimited = findRateLimited(handlerMethod);
        if (rateLimited == null) {
            return true;
        }

        if (rateLimiter.tryConsume(resolveKey(request, handlerMethod), rateLimited.value())) {
            return true;
        }

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        return false;
    }

    private RateLimited findRateLimited(HandlerMethod handlerMethod) {
        RateLimited methodAnnotation = handlerMethod.getMethodAnnotation(RateLimited.class);
        return methodAnnotation != null
                ? methodAnnotation
                : handlerMethod.getBeanType().getAnnotation(RateLimited.class);
    }

    private String resolveKey(HttpServletRequest request, HandlerMethod handlerMethod) {
        String endpoint = handlerMethod.getBeanType().getSimpleName() + "#" + handlerMethod.getMethod().getName();
        String userUuid = SecurityUtil.getCurrentUserUuid();
        return endpoint + ":" + (userUuid != null ? userUuid : request.getRemoteAddr());
    }
}
