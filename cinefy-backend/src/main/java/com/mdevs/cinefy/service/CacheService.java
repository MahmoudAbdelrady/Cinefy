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
        Object value = executeOnRedis("read", () -> redisTemplate.opsForValue().get(key));
        log.info("Cache {}", value == null ? "miss" : "hit");
        return value;
    }

    public boolean exists(String key) {
        boolean exists = Boolean.TRUE.equals(executeOnRedis("check", () -> redisTemplate.hasKey(key)));
        log.info("Cache entry {}", exists ? "exists" : "does not exist");
        return exists;
    }

    public void add(String key, Object value, Duration ttl) {
        Duration effectiveTtl = resolveTtl(ttl);
        executeOnRedis("write", () -> {
            redisTemplate.opsForValue().set(key, value, effectiveTtl);
            return null;
        });
        log.info("Cached value with TTL {}", effectiveTtl);
    }

    public boolean addIfAbsent(String key, Object value, Duration ttl) {
        Duration effectiveTtl = resolveTtl(ttl);
        boolean added = Boolean.TRUE.equals(executeOnRedis("write-if-absent", () -> redisTemplate.opsForValue().setIfAbsent(key, value, effectiveTtl)));
        log.info(added ? "Cached value with TTL {}" : "Cache entry already exists, skipped write", effectiveTtl);
        return added;
    }

    public boolean delete(String key) {
        boolean deleted = Boolean.TRUE.equals(executeOnRedis("delete", () -> redisTemplate.delete(key)));
        log.info(deleted ? "Deleted cache entry" : "No cache entry to delete");
        return deleted;
    }

    // =========================== Helpers ===========================

    private <T> T executeOnRedis(String operation, Supplier<T> action) {
        try {
            return action.get();
        } catch (DataAccessException ex) {
            log.error("Failed to {} cache entry", operation, ex);
            throw new RuntimeException("Cache is unavailable", ex);
        }
    }

    private Duration resolveTtl(Duration ttl) {
        return ttl != null ? ttl : Duration.ofMinutes(defaultTtlMinutes);
    }
}
