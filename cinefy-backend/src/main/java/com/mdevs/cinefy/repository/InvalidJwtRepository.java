package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.InvalidJwt;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface InvalidJwtRepository extends BaseRepository<InvalidJwt> {

    boolean existsByJti(String jti);

    @Modifying
    @Query("DELETE FROM InvalidJwt i WHERE i.expirationDate < :now")
    int deleteExpired(@Param("now") LocalDateTime now);
}
