package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.PaymentGateway;

import java.util.List;

public interface PaymentGatewayRepository extends BaseRepository<PaymentGateway> {

    List<PaymentGateway> findAllByOrderByCreatedAtDesc();

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);
}
