package com.mdevs.cinefy.service;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;
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

    private static final PhoneNumberUtil PHONE_NUMBER_UTIL = PhoneNumberUtil.getInstance();

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
        if (StringUtils.isEmpty(dto.getPassword())) {
            throw new BusinessException("Password is required");
        }

        StaffMember staffMember = new StaffMember();
        populateFromDto(staffMember, dto, null);
        staffMember.setPassword(passwordEncoder.encode(dto.getPassword()));

        staffMemberRepository.save(staffMember);
        return toSummaryDTO(staffMember);
    }

    @Transactional
    public StaffMemberSummaryDTO updateStaffMember(String uuid, StaffMemberDTO dto) {
        StaffMember staffMember = findStaffMember(uuid);
        populateFromDto(staffMember, dto, staffMember.getId());
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

    private void validateStaffMember(StaffMemberDTO dto, String normalizedEmail, String normalizedPhoneNumber, StaffPosition position, Long excludeId) {
        if (position.equals(StaffPosition.ADMIN)) { // @ TODO: update the condition to check if the current user isn't admin
            throw new BusinessException("Assigning the admin position is not allowed");
        }
        if (dto.getWorkingHourStart().equals(dto.getWorkingHourEnd())) {
            throw new BusinessException("Working hour end must be different from working hour start");
        }
        boolean usernameExists = excludeId == null
                ? staffMemberRepository.existsByUsername(dto.getUsername())
                : staffMemberRepository.existsByUsernameAndIdNot(dto.getUsername(), excludeId);
        if (usernameExists) {
            throw new BusinessException("Username already in use");
        }
        boolean emailExists = excludeId == null
                ? staffMemberRepository.existsByEmail(normalizedEmail)
                : staffMemberRepository.existsByEmailAndIdNot(normalizedEmail, excludeId);
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

    private void populateFromDto(StaffMember staffMember, StaffMemberDTO dto, Long excludeId) {
        String normalizedEmail = dto.getEmail().trim().toLowerCase();
        String normalizedPhoneNumber = normalizePhoneNumber(dto.getPhoneNumber());
        StaffPosition position = StaffPosition.fromString(dto.getPosition());
        validateStaffMember(dto, normalizedEmail, normalizedPhoneNumber, position, excludeId);

        staffMember.setFirstName(dto.getFirstName());
        staffMember.setLastName(dto.getLastName());
        staffMember.setFullName(User.toFullName(dto.getFirstName(), dto.getLastName()));
        staffMember.setUsername(dto.getUsername());
        staffMember.setEmail(normalizedEmail);
        staffMember.setPhoneNumber(normalizedPhoneNumber);
        staffMember.setPosition(position);
        staffMember.setEmploymentType(EmploymentType.fromString(dto.getEmploymentType()));
        staffMember.setWorkingDayStart(parseDayOfWeek(dto.getWorkingDayStart(), "workingDayStart"));
        staffMember.setWorkingDayEnd(parseDayOfWeek(dto.getWorkingDayEnd(), "workingDayEnd"));
        staffMember.setWorkingHourStart(parseTime(dto.getWorkingHourStart(), "workingHourStart"));
        staffMember.setWorkingHourEnd(parseTime(dto.getWorkingHourEnd(), "workingHourEnd"));
    }

    private DayOfWeek parseDayOfWeek(String value, String fieldName) {
        try {
            return DayOfWeek.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Invalid week day for: " + fieldName);
        }
    }

    private LocalTime parseTime(String value, String fieldName) {
        try {
            return LocalTime.parse(value);
        } catch (DateTimeParseException ex) {
            throw new BusinessException("Invalid format for: " + fieldName);
        }
    }

    private String normalizePhoneNumber(String phoneNumber) {
        String digits = phoneNumber.trim().replaceAll("\\D", "");
        PhoneNumber parsed;
        try {
            parsed = PHONE_NUMBER_UTIL.parse("+" + digits, null);
        } catch (NumberParseException ex) {
            throw new BusinessException("Invalid phone number");
        }
        if (!PHONE_NUMBER_UTIL.isValidNumber(parsed)) {
            throw new BusinessException("Invalid phone number");
        }
        // Canonical E.164 (e.g. "+201001234567"); store digits-only.
        return PHONE_NUMBER_UTIL.format(parsed, PhoneNumberUtil.PhoneNumberFormat.E164).substring(1);
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
        dto.setPosition(staffMember.getPosition().name());
        dto.setHiredAt(staffMember.getCreatedAt());
        dto.setEmploymentType(staffMember.getEmploymentType().name());
        dto.setWorkingDayStart(staffMember.getWorkingDayStart().name());
        dto.setWorkingDayEnd(staffMember.getWorkingDayEnd().name());
        dto.setWorkingHourStart(staffMember.getWorkingHourStart().toString());
        dto.setWorkingHourEnd(staffMember.getWorkingHourEnd().toString());
        return dto;
    }
}
