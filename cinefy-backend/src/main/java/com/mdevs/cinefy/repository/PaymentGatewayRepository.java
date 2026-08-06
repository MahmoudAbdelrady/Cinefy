package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.PaymentGateway;

import java.util.List;
import java.util.Optional;

public interface PaymentGatewayRepository extends BaseRepository<PaymentGateway> {

    Optional<PaymentGateway> findByUuid(String uuid);

    Optional<PaymentGateway> findByActiveTrue();

    List<PaymentGateway> findAllByOrderByCreatedAtDesc();

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);
}
