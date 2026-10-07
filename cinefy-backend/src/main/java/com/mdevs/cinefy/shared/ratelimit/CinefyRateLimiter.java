package com.mdevs.cinefy.shared.ratelimit;

import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.TimeoutException;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.lettuce.core.RedisException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CinefyRateLimiter {

    private final ProxyManager<String> rateLimitProxyManager;

    @Value("${cinefy.rate-limit-enabled}")
    private boolean rateLimitEnabled;

    private static final String KEY_PREFIX = "rate-limit:";

    public boolean tryConsume(String key, RateLimitPolicy policy) {
        if (!rateLimitEnabled) {
            return true;
        }

        try {
            return rateLimitProxyManager.getProxy(KEY_PREFIX + key, () -> createBucketConfiguration(policy)).tryConsume(1);
        } catch (RedisException | TimeoutException ex) {
            log.error("Rate limit check failed, allowing request: {}", ex.getMessage(), ex);
            return true;
        }
    }

    private BucketConfiguration createBucketConfiguration(RateLimitPolicy policy) {
        return BucketConfiguration.builder()
                .addLimit(limit -> limit
                        .capacity(policy.getCapacity())
                        .refillGreedy(policy.getRefillTokens(), policy.getRefillPeriod()))
                .build();
    }
}
