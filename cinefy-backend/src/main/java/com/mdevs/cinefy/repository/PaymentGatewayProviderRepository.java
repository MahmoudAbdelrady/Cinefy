package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.PaymentGatewayProvider;

public interface PaymentGatewayProviderRepository extends BaseRepository<PaymentGatewayProvider> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);
}
