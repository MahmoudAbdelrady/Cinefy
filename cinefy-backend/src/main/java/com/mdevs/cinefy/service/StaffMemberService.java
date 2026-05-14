package com.mdevs.cinefy.service;

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

@Service
@RequiredArgsConstructor
public class StaffMemberService {

    private final StaffMemberRepository staffMemberRepository;

    private final PasswordEncoder passwordEncoder;

    // ========================= Public API =========================

    public Page<StaffMemberSummaryDTO> getStaffMembers(String name, String position, Pageable pageable) {
        StaffPosition positionFilter = StringUtils.isBlank(position) ? null : StaffPosition.fromString(position);
        String nameFilter = StringUtils.isBlank(name) ? null : name;
        return staffMemberRepository.findAllFiltered(nameFilter, positionFilter, pageable)
                .map(this::toSummaryDTO);
    }

    public StaffMemberDetailDTO getStaffMember(String uuid) {
        return toDetailDTO(findStaffMember(uuid));
    }

    @Transactional
    public StaffMemberSummaryDTO createStaffMember(StaffMemberDTO dto) {
        String normalizedPhoneNumber = normalizePhoneNumber(dto.getPhoneNumber());
        StaffPosition position = StaffPosition.fromString(dto.getPosition());
        validateStaffMember(dto, normalizedPhoneNumber, position);

        EmploymentType employmentType = EmploymentType.fromString(dto.getEmploymentType());
        DayOfWeek workingDayStart = parseDayOfWeek(dto.getWorkingDayStart(), "workingDayStart");
        DayOfWeek workingDayEnd = parseDayOfWeek(dto.getWorkingDayEnd(), "workingDayEnd");
        LocalTime workingHourStart = parseTime(dto.getWorkingHourStart(), "workingHourStart");
        LocalTime workingHourEnd = parseTime(dto.getWorkingHourEnd(), "workingHourEnd");

        StaffMember staffMember = new StaffMember();
        staffMember.setFirstName(dto.getFirstName());
        staffMember.setLastName(dto.getLastName());
        staffMember.setFullName(User.toFullName(dto.getFirstName(), dto.getLastName()));
        staffMember.setUsername(dto.getUsername());
        staffMember.setPhoneNumber(normalizedPhoneNumber);
        staffMember.setEmail(dto.getEmail());
        staffMember.setPassword(passwordEncoder.encode(dto.getPassword()));
        staffMember.setPosition(position);
        staffMember.setEmploymentType(employmentType);
        staffMember.setWorkingDayStart(workingDayStart);
        staffMember.setWorkingDayEnd(workingDayEnd);
        staffMember.setWorkingHourStart(workingHourStart);
        staffMember.setWorkingHourEnd(workingHourEnd);

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

    private void validateStaffMember(StaffMemberDTO dto, String normalizedPhoneNumber, StaffPosition position) {
        if (position.equals(StaffPosition.ADMIN)) {
            throw new BusinessException("Assigning the admin position is not allowed");
        }
        if (staffMemberRepository.existsByUsername(dto.getUsername())) {
            throw new BusinessException("Username already in use");
        }
        if (staffMemberRepository.existsByEmail(dto.getEmail())) {
            throw new BusinessException("Email already in use");
        }
        if (staffMemberRepository.existsByPhoneNumber(normalizedPhoneNumber)) {
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
