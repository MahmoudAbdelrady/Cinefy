package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.staff.PositionCoverageDTO;
import com.mdevs.cinefy.dto.staff.PositionCoverageItemDTO;
import com.mdevs.cinefy.dto.staff.PositionCoverageProjection;
import com.mdevs.cinefy.dto.staff.StaffMemberDTO;
import com.mdevs.cinefy.dto.staff.StaffMemberDetailDTO;
import com.mdevs.cinefy.dto.staff.StaffMemberSummaryDTO;
import com.mdevs.cinefy.entity.EmploymentType;
import com.mdevs.cinefy.entity.StaffMember;
import com.mdevs.cinefy.entity.StaffPosition;
import com.mdevs.cinefy.entity.User;
import com.mdevs.cinefy.repository.StaffMemberRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffMemberService {

    private final StaffMemberRepository staffMemberRepository;

    private final PasswordEncoder passwordEncoder;

    // ========================= Public API =========================

    public Page<StaffMemberSummaryDTO> getStaffMembers(String name, String position, Pageable pageable) {
        StaffPosition positionFilter = StringUtils.isEmpty(position) ? null : StaffPosition.fromString(position);
        String nameFilter = StringUtils.isEmpty(name) ? null : name;
        return staffMemberRepository.findAllFiltered(nameFilter, positionFilter, pageable)
                .map(this::toSummaryDTO);
    }

    public StaffMemberDetailDTO getStaffMember(String uuid) {
        return toDetailDTO(findStaffMember(uuid));
    }

    public PositionCoverageDTO getPositionCoverage() {
        PositionCoverageProjection countResult = staffMemberRepository.getPositionCoverage();
        PositionCoverageDTO dto = new PositionCoverageDTO();
        dto.setTotal(countResult.getTotal());
        dto.setPositions(List.of(
                new PositionCoverageItemDTO(StaffPosition.MANAGER.name(), countResult.getManagerCount()),
                new PositionCoverageItemDTO(StaffPosition.CASHIER.name(), countResult.getCashierCount()),
                new PositionCoverageItemDTO(StaffPosition.USHER.name(), countResult.getUsherCount())));
        return dto;
    }

    @Transactional
    public StaffMemberSummaryDTO createStaffMember(StaffMemberDTO dto) {
        String normalizedPhoneNumber = normalizePhoneNumber(dto.getPhoneNumber());
        StaffPosition position = StaffPosition.fromString(dto.getPosition());
        validateStaffMember(dto, normalizedPhoneNumber, position, null);

        if (StringUtils.isBlank(dto.getPassword())) {
            throw new BusinessException("Password is required");
        }

        StaffMember staffMember = new StaffMember();
        applyDtoToStaffMember(staffMember, dto, normalizedPhoneNumber, position);
        staffMember.setPassword(passwordEncoder.encode(dto.getPassword()));

        staffMemberRepository.save(staffMember);
        return toSummaryDTO(staffMember);
    }

    @Transactional
    public StaffMemberSummaryDTO updateStaffMember(String uuid, StaffMemberDTO dto) {
        StaffMember staffMember = findStaffMember(uuid);
        String normalizedPhoneNumber = normalizePhoneNumber(dto.getPhoneNumber());
        StaffPosition position = StaffPosition.fromString(dto.getPosition());
        validateStaffMember(dto, normalizedPhoneNumber, position, staffMember.getId());

        applyDtoToStaffMember(staffMember, dto, normalizedPhoneNumber, position);
        if (StringUtils.isNotEmpty(dto.getPassword())) {
            staffMember.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        staffMemberRepository.save(staffMember);
        return toSummaryDTO(staffMember);
    }

    @Transactional
    public void deleteStaffMember(String uuid) {
        StaffMember staffMember = findStaffMember(uuid);
        staffMemberRepository.delete(staffMember);
    }

    // =========================== Helpers ===========================

    private StaffMember findStaffMember(String uuid) {
        return staffMemberRepository.findByUuid(uuid)
                .orElseThrow(() -> new NotFoundException("Staff member not found with id: " + uuid));
    }

    private void validateStaffMember(StaffMemberDTO dto, String normalizedPhoneNumber, StaffPosition position, Long excludeId) {
        if (position.equals(StaffPosition.ADMIN)) { // @ TODO: update the condition to check if the current user isn't admin
            throw new BusinessException("Assigning the admin position is not allowed");
        }
        boolean usernameExists = excludeId == null
                ? staffMemberRepository.existsByUsername(dto.getUsername())
                : staffMemberRepository.existsByUsernameAndIdNot(dto.getUsername(), excludeId);
        if (usernameExists) {
            throw new BusinessException("Username already in use");
        }
        boolean emailExists = excludeId == null
                ? staffMemberRepository.existsByEmail(dto.getEmail())
                : staffMemberRepository.existsByEmailAndIdNot(dto.getEmail(), excludeId);
        if (emailExists) {
            throw new BusinessException("Email already in use");
        }
        boolean phoneNumberExists = excludeId == null
                ? staffMemberRepository.existsByPhoneNumber(normalizedPhoneNumber)
                : staffMemberRepository.existsByPhoneNumberAndIdNot(normalizedPhoneNumber, excludeId);
        if (phoneNumberExists) {
            throw new BusinessException("Phone number already in use");
        }
    }

    private DayOfWeek parseDayOfWeek(String value, String fieldName) {
        try {
            return DayOfWeek.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Invalid " + fieldName + ": " + value);
        }
    }

    private LocalTime parseTime(String value, String fieldName) {
        try {
            return LocalTime.parse(value);
        } catch (DateTimeParseException ex) {
            throw new BusinessException("Invalid " + fieldName + ": " + value);
        }
    }

    private String normalizePhoneNumber(String phoneNumber) {
        return phoneNumber.trim().replaceAll("\\D", "");
    }

    private void applyDtoToStaffMember(StaffMember staffMember, StaffMemberDTO dto, String normalizedPhoneNumber, StaffPosition position) {
        staffMember.setFirstName(dto.getFirstName());
        staffMember.setLastName(dto.getLastName());
        staffMember.setFullName(User.toFullName(dto.getFirstName(), dto.getLastName()));
        staffMember.setUsername(dto.getUsername());
        staffMember.setPhoneNumber(normalizedPhoneNumber);
        staffMember.setEmail(dto.getEmail());
        staffMember.setPosition(position);
        staffMember.setEmploymentType(EmploymentType.fromString(dto.getEmploymentType()));
        staffMember.setWorkingDayStart(parseDayOfWeek(dto.getWorkingDayStart(), "workingDayStart"));
        staffMember.setWorkingDayEnd(parseDayOfWeek(dto.getWorkingDayEnd(), "workingDayEnd"));
        staffMember.setWorkingHourStart(parseTime(dto.getWorkingHourStart(), "workingHourStart"));
        staffMember.setWorkingHourEnd(parseTime(dto.getWorkingHourEnd(), "workingHourEnd"));
    }

    private StaffMemberSummaryDTO toSummaryDTO(StaffMember staffMember) {
        StaffMemberSummaryDTO dto = new StaffMemberSummaryDTO();
        dto.setId(staffMember.getUuid());
        dto.setFullName(staffMember.getFullName());
        dto.setPhoneNumber(staffMember.getPhoneNumber());
        dto.setEmail(staffMember.getEmail());
        dto.setPosition(staffMember.getPosition().name());
        dto.setWorkingDayStart(staffMember.getWorkingDayStart().name());
        dto.setWorkingDayEnd(staffMember.getWorkingDayEnd().name());
        dto.setWorkingHourStart(staffMember.getWorkingHourStart().toString());
        dto.setWorkingHourEnd(staffMember.getWorkingHourEnd().toString());
        return dto;
    }

    private StaffMemberDetailDTO toDetailDTO(StaffMember staffMember) {
        StaffMemberDetailDTO dto = new StaffMemberDetailDTO();
        dto.setId(staffMember.getUuid());
        dto.setFirstName(staffMember.getFirstName());
        dto.setLastName(staffMember.getLastName());
        dto.setUsername(staffMember.getUsername());
        dto.setEmail(staffMember.getEmail());
        dto.setPhoneNumber(staffMember.getPhoneNumber());
        dto.setHiredAt(staffMember.getCreatedAt());
        dto.setEmploymentType(staffMember.getEmploymentType().name());
        dto.setWorkingDayStart(staffMember.getWorkingDayStart().name());
        dto.setWorkingDayEnd(staffMember.getWorkingDayEnd().name());
        dto.setWorkingHourStart(staffMember.getWorkingHourStart().toString());
        dto.setWorkingHourEnd(staffMember.getWorkingHourEnd().toString());
        return dto;
    }
}
