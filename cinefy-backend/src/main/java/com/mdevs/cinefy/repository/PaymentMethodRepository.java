package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.PaymentMethod;
import com.mdevs.cinefy.entity.enums.PaymentMethodStatus;
import com.mdevs.cinefy.entity.enums.PaymentMethodType;

import java.util.List;
import java.util.Optional;

public interface PaymentMethodRepository extends BaseRepository<PaymentMethod> {

    Optional<PaymentMethod> findByUuid(String uuid);

    List<PaymentMethod> findAllByOrderByCreatedAtDesc();

    boolean existsByTypeAndStatusAndIdNot(PaymentMethodType type, PaymentMethodStatus status, Long id);
}
