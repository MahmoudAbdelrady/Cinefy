package com.mdevs.cinefy.shared.annotation;

import com.mdevs.cinefy.shared.ratelimit.RateLimitPolicy;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimited {

    RateLimitPolicy value() default RateLimitPolicy.STANDARD;
}
