package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.StaffMember;
import com.mdevs.cinefy.entity.StaffPosition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface StaffMemberRepository extends BaseRepository<StaffMember> {

    Optional<StaffMember> findByUuid(String uuid);

    @Query("SELECT s FROM StaffMember s " +
            "WHERE (:name IS NULL OR LOWER(s.fullName) LIKE LOWER(CONCAT('%', CAST(:name AS string), '%'))) " +
            "AND (:position IS NULL OR s.position = :position) ORDER BY s.createdAt")
    Page<StaffMember> findAllFiltered(@Param("name") String name, @Param("position") StaffPosition position, Pageable pageable);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);
}
