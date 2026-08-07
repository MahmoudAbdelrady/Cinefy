package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.PaymentGateway;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentGatewayRepository extends BaseRepository<PaymentGateway> {

    Optional<PaymentGateway> findByUuid(String uuid);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT g FROM PaymentGateway g WHERE g.uuid = :uuid AND g.deletedAt IS NULL")
    Optional<PaymentGateway> findByUuidForUpdate(@Param("uuid") String uuid);

    Optional<PaymentGateway> findByActiveTrueAndDeletedAtIsNull();

    List<PaymentGateway> findAllByDeletedAtIsNullOrderByCreatedAtDesc();

    boolean existsByCodeAndDeletedAtIsNull(String code);

    boolean existsByCodeAndDeletedAtIsNullAndIdNot(String code, Long id);
}
