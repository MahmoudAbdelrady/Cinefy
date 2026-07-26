package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.ClientPaymentMethod;

import java.util.List;
import java.util.Optional;

public interface ClientPaymentMethodRepository extends BaseRepository<ClientPaymentMethod> {

    List<ClientPaymentMethod> findAllByClientId(Long clientId);

    Optional<ClientPaymentMethod> findByUuid(String uuid);

    boolean existsByToken(String token);
}
