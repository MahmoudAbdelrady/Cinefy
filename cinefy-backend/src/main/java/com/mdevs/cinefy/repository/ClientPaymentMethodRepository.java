package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.ClientPaymentMethod;

import java.util.List;

public interface ClientPaymentMethodRepository extends BaseRepository<ClientPaymentMethod> {

    List<ClientPaymentMethod> findAllByClientId(Long clientId);

    boolean existsByToken(String token);
}
