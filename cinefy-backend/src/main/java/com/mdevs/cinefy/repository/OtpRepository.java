package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.Otp;
import com.mdevs.cinefy.entity.enums.OtpType;
import com.mdevs.cinefy.entity.enums.UserType;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpRepository extends BaseRepository<Otp> {

    Optional<Otp> findByCodeAndType(String code, OtpType type);

    @Modifying
    void deleteByUserIdAndUserTypeAndTypeAndExpirationDateAfter(Long userId, UserType userType, OtpType type, LocalDateTime now);

    @Modifying
    @Query(
            value = "DELETE FROM OTPS WHERE ID IN (SELECT ID FROM OTPS WHERE EXPIRATION_DATE < :now ORDER BY ID LIMIT :batchSize)",
            nativeQuery = true
    )
    int deleteExpiredBatch(@Param("now") LocalDateTime now, @Param("batchSize") int batchSize);
}
