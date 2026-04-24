package com.mdevs.cinefy.aspect;

import com.mdevs.cinefy.utils.LoggingUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;

@Aspect
@Component
@Slf4j
public class RequestLoggingAspect {
    @Around("within(@org.springframework.web.bind.annotation.RestController *)")
    public Object logAroundControllerMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return joinPoint.proceed();
        }

        HttpServletRequest request = attributes.getRequest();

        String logInfo = "({}) Request URI: {}";

        List<Object> logArgs = List.of(request.getMethod(), request.getRequestURI());

        return LoggingUtil.proceedWithLogging(joinPoint, log, logInfo, logArgs);
    }
}