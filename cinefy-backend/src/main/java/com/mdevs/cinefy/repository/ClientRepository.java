package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.Client;

import java.util.Optional;

public interface ClientRepository extends BaseRepository<Client> {

    Optional<Client> findByUuid(String uuid);

    Optional<Client> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByPhoneNumberAndIdNot(String phoneNumber, Long id);
}
