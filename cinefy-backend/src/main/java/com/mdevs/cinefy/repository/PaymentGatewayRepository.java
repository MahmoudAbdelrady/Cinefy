package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.PaymentGateway;

public interface PaymentGatewayRepository extends BaseRepository<PaymentGateway> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);
}
