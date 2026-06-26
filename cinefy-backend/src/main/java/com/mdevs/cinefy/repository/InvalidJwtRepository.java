package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.InvalidJwt;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface InvalidJwtRepository extends BaseRepository<InvalidJwt> {

    boolean existsByJti(String jti);

    @Modifying
    @Query(
            value = "DELETE FROM INVALID_JWTS WHERE ID IN (SELECT ID FROM INVALID_JWTS WHERE EXPIRATION_DATE < :cutoffDate ORDER BY ID LIMIT :batchSize)",
            nativeQuery = true
    )
    int deleteExpiredBatch(@Param("cutoffDate") LocalDateTime cutoffDate, @Param("batchSize") int batchSize);
}
