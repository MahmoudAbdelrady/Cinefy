package com.mdevs.cinefy.shared.ratelimit;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.Duration;

@Getter
@RequiredArgsConstructor
public enum RateLimitPolicy {

    STANDARD(50, 50, Duration.ofSeconds(60)),
    STRICT(10, 10, Duration.ofSeconds(60));

    private final long capacity;

    private final long refillTokens;

    private final Duration refillPeriod;
}
