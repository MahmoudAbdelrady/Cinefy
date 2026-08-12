package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.ClientPaymentMethod;

import java.util.List;
import java.util.Optional;

public interface ClientPaymentMethodRepository extends BaseRepository<ClientPaymentMethod> {

    List<ClientPaymentMethod> findAllByClientIdOrderByCreatedAtAsc(Long clientId);

    Optional<ClientPaymentMethod> findByUuidAndClientId(String uuid, Long clientId);

    boolean existsByToken(String token);
}
