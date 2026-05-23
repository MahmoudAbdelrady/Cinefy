package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.dto.staff.PositionCoverageProjection;
import com.mdevs.cinefy.entity.StaffMember;
import com.mdevs.cinefy.entity.StaffPosition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface StaffMemberRepository extends BaseRepository<StaffMember> {

    Optional<StaffMember> findByUuid(String uuid);

    Optional<StaffMember> findByUsername(String username);

    @Query("SELECT s FROM StaffMember s " +
            "WHERE s.position != 'ADMIN' "
            + "AND (:currentUserUuid IS NULL OR s.uuid != :currentUserUuid) "
            + "AND (:name IS NULL OR LOWER(s.fullName) LIKE LOWER(CONCAT('%', CAST(:name AS string), '%'))) "
            + "AND (:position IS NULL OR s.position = :position) ORDER BY s.createdAt")
    Page<StaffMember> findAllFiltered(@Param("currentUserUuid") String currentUserUuid, @Param("name") String name, @Param("position") StaffPosition position, Pageable pageable);

    @Query("SELECT new com.mdevs.cinefy.dto.staff.PositionCoverageProjection(" +
            "COALESCE(SUM(CASE WHEN s.position != 'ADMIN' THEN 1 ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN s.position = 'MANAGER' THEN 1 ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN s.position = 'CASHIER' THEN 1 ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN s.position = 'USHER' THEN 1 ELSE 0 END), 0)) " +
            "FROM StaffMember s")
    PositionCoverageProjection getPositionCoverage();

    boolean existsByUsername(String username);

    boolean existsByUsernameAndIdNot(String username, Long id);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByPhoneNumberAndIdNot(String phoneNumber, Long id);
}
