package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.PaymentMethod;

import java.util.List;
import java.util.Optional;

public interface PaymentMethodRepository extends BaseRepository<PaymentMethod> {

    Optional<PaymentMethod> findByUuid(String uuid);

    List<PaymentMethod> findAllByOrderByCreatedAtDesc();
}
