package com.mdevs.cinefy.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.function.Supplier;

@Slf4j
@Service
@RequiredArgsConstructor
public class CacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${spring.data.redis.default-ttl-minutes}")
    private int defaultTtlMinutes;

    // ========================= Public API =========================

    public Object get(String key) {
        Object value = executeOnRedis("read", key, () -> redisTemplate.opsForValue().get(key));
        log.info("Cache {} for key '{}'", value == null ? "miss" : "hit", key);
        return value;
    }

    public boolean exists(String key) {
        boolean exists = Boolean.TRUE.equals(executeOnRedis("check", key, () -> redisTemplate.hasKey(key)));
        log.info("Cache key '{}' {}", key, exists ? "exists" : "does not exist");
        return exists;
    }

    public void add(String key, Object value, Duration ttl) {
        Duration effectiveTtl = resolveTtl(ttl);
        executeOnRedis("write", key, () -> {
            redisTemplate.opsForValue().set(key, value, effectiveTtl);
            return null;
        });
        log.info("Cached value for key '{}' with TTL {}", key, effectiveTtl);
    }

    public boolean addIfAbsent(String key, Object value, Duration ttl) {
        Duration effectiveTtl = resolveTtl(ttl);
        boolean added = Boolean.TRUE.equals(executeOnRedis("write-if-absent", key, () -> redisTemplate.opsForValue().setIfAbsent(key, value, effectiveTtl)));
        log.info(added ? "Cached value for key '{}' with TTL {}" : "Cache key '{}' already exists, skipped write", key, effectiveTtl);
        return added;
    }

    public void delete(String key) {
        boolean deleted = Boolean.TRUE.equals(executeOnRedis("delete", key, () -> redisTemplate.delete(key)));
        log.info("{} for key '{}'", deleted ? "Deleted cache entry" : "No cache entry to delete", key);
    }

    // =========================== Helpers ===========================

    private <T> T executeOnRedis(String operation, String key, Supplier<T> action) {
        try {
            return action.get();
        } catch (DataAccessException ex) {
            log.error("Failed to {} cache key '{}'", operation, key, ex);
            throw new RuntimeException("Cache is unavailable", ex);
        }
    }

    private Duration resolveTtl(Duration ttl) {
        return ttl != null ? ttl : Duration.ofMinutes(defaultTtlMinutes);
    }
}
