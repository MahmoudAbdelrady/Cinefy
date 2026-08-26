package com.mdevs.cinefy.service;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;
import com.mdevs.cinefy.dto.staff.ChangePasswordDTO;
import com.mdevs.cinefy.dto.staff.CurrentStaffMemberDTO;
import com.mdevs.cinefy.dto.staff.OnShiftSummaryDTO;
import com.mdevs.cinefy.dto.staff.PositionCoverageDTO;
import com.mdevs.cinefy.dto.staff.PositionCoverageItemDTO;
import com.mdevs.cinefy.dto.staff.PositionCoverageProjection;
import com.mdevs.cinefy.dto.staff.StaffMemberDTO;
import com.mdevs.cinefy.dto.staff.UpdateProfileDTO;
import com.mdevs.cinefy.dto.staff.StaffMemberDetailDTO;
import com.mdevs.cinefy.dto.staff.StaffMemberSummaryDTO;
import com.mdevs.cinefy.entity.enums.EmploymentType;
import com.mdevs.cinefy.entity.StaffMember;
import com.mdevs.cinefy.entity.enums.StaffPosition;
import com.mdevs.cinefy.entity.User;
import com.mdevs.cinefy.repository.StaffMemberRepository;
import com.mdevs.cinefy.shared.exception.ErrorCode;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.ForbiddenException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import com.mdevs.cinefy.shared.security.SecurityUtil;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StaffMemberService implements UserDetailsService {

    private final StaffMemberRepository staffMemberRepository;

    private final PasswordEncoder passwordEncoder;

    private static final PhoneNumberUtil PHONE_NUMBER_UTIL = PhoneNumberUtil.getInstance();

    // ========================= Public API =========================

    public Page<StaffMemberSummaryDTO> getStaffMembers(String name, String position, Pageable pageable) {
        StaffPosition positionFilter = StringUtils.isEmpty(position) ? null : StaffPosition.fromString(position);
        String nameFilter = StringUtils.isEmpty(name) ? null : name;
        return staffMemberRepository.findAllFiltered(SecurityUtil.getCurrentUserUuid(), nameFilter, positionFilter, pageable)
                .map(this::toSummaryDTO);
    }

    public StaffMemberDetailDTO getStaffMember(String uuid) {
        StaffMember staffMember = findStaffMember(uuid);
        validateCanViewStaffMember(staffMember);
        return toDetailDTO(staffMember);
    }

    public PositionCoverageDTO getPositionCoverage() {
        PositionCoverageProjection countResult = staffMemberRepository.getPositionCoverage();
        PositionCoverageDTO dto = new PositionCoverageDTO();
        dto.setTotal(countResult.total());
        dto.setPositions(List.of(
                new PositionCoverageItemDTO(StaffPosition.MANAGER.name(), countResult.managerCount()),
                new PositionCoverageItemDTO(StaffPosition.CASHIER.name(), countResult.cashierCount()),
                new PositionCoverageItemDTO(StaffPosition.USHER.name(), countResult.usherCount())));
        return dto;
    }

    public OnShiftSummaryDTO getOnShiftSummary() {
        LocalDateTime now = LocalDateTime.now();
        LocalTime currentTime = now.toLocalTime();

        Map<StaffPosition, Long> details = new EnumMap<>(StaffPosition.class);
        for (StaffPosition position : StaffPosition.values()) {
            if (!position.equals(StaffPosition.ADMIN)) {
                details.put(position, 0L);
            }
        }

        staffMemberRepository.findAllOnShiftAt(currentTime).stream()
                .filter(staffMember -> isWorkingDay(staffMember, now))
                .forEach(staffMember -> details.merge(staffMember.getPosition(), 1L, Long::sum));

        return new OnShiftSummaryDTO(staffMemberRepository.countNonAdmin(), details);
    }

    public CurrentStaffMemberDTO getCurrentStaffMember() {
        StaffMember staffMember = findStaffMember(SecurityUtil.getCurrentUserUuid());
        return new CurrentStaffMemberDTO(
                staffMember.getUuid(),
                staffMember.getFirstName(),
                staffMember.getLastName(),
                staffMember.getFullName(),
                staffMember.getPosition().name());
    }

    @Override
    public UserDetails loadUserByUsername(@NonNull String email) throws UsernameNotFoundException {
        StaffMember staffMember = staffMemberRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Staff member not found with email: " + email));
        return UserPrincipal.fromStaffMember(staffMember);
    }

    @Transactional
    public StaffMemberSummaryDTO createStaffMember(StaffMemberDTO dto) {
        if (StringUtils.isEmpty(dto.getPassword())) {
            throw new BusinessException("Password is required");
        }
        validateCanManageManagerTier(null, StaffPosition.fromString(dto.getPosition()));

        StaffMember staffMember = new StaffMember();
        populateFromDto(staffMember, dto, null);
        staffMember.setPassword(passwordEncoder.encode(dto.getPassword()));

        staffMemberRepository.save(staffMember);
        return toSummaryDTO(staffMember);
    }

    @Transactional
    public void ensureAdminExists(String email, String rawPassword) {
        if (staffMemberRepository.existsByEmail(email)) {
            return;
        }

        StaffMember admin = new StaffMember();
        admin.setFirstName("System");
        admin.setLastName("Administrator");
        admin.setFullName(User.toFullName(admin.getFirstName(), admin.getLastName()));
        admin.setEmail(email);
        admin.setPhoneNumber("0000000000");
        admin.setPassword(passwordEncoder.encode(rawPassword));
        admin.setPosition(StaffPosition.ADMIN);
        admin.setEmploymentType(EmploymentType.FULL_TIME);
        admin.setWorkingDayStart(DayOfWeek.MONDAY);
        admin.setWorkingDayEnd(DayOfWeek.FRIDAY);
        admin.setWorkingHourStart(LocalTime.MIDNIGHT);
        admin.setWorkingHourEnd(LocalTime.MIDNIGHT);

        staffMemberRepository.save(admin);
    }

    @Transactional
    public StaffMemberSummaryDTO updateStaffMember(String uuid, StaffMemberDTO dto) {
        StaffMember staffMember = findStaffMember(uuid);
        validateNotAdminAccount(staffMember);
        validateCanManageManagerTier(staffMember.getPosition(), StaffPosition.fromString(dto.getPosition()));
        populateFromDto(staffMember, dto, staffMember.getId());
        if (StringUtils.isNotEmpty(dto.getPassword())) {
            staffMember.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        staffMemberRepository.save(staffMember);
        return toSummaryDTO(staffMember);
    }

    @Transactional
    public StaffMemberDetailDTO updateProfile(UpdateProfileDTO dto) {
        StaffMember staffMember = findStaffMember(SecurityUtil.getCurrentUserUuid());
        validateNotAdminAccount(staffMember);
        String normalizedPhoneNumber = normalizePhoneNumber(dto.getPhoneNumber());
        if (staffMemberRepository.existsByPhoneNumberAndIdNot(normalizedPhoneNumber, staffMember.getId())) {
            throw new BusinessException("Phone number already in use");
        }

        staffMember.setFirstName(dto.getFirstName());
        staffMember.setLastName(dto.getLastName());
        staffMember.setFullName(User.toFullName(dto.getFirstName(), dto.getLastName()));
        staffMember.setPhoneNumber(normalizedPhoneNumber);

        staffMemberRepository.save(staffMember);
        return toDetailDTO(staffMember);
    }

    @Transactional
    public void deleteStaffMember(String uuid) {
        StaffMember staffMember = findStaffMember(uuid);
        validateNotAdminAccount(staffMember);
        validateCanManageManagerTier(staffMember.getPosition(), null);
        staffMemberRepository.delete(staffMember);
    }

    @Transactional
    public void updatePassword(Long id, String rawPassword) {
        StaffMember staffMember = staffMemberRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Staff member not found with id: " + id));
        validateNotAdminAccount(staffMember);
        applyNewPassword(staffMember, rawPassword);
    }

    @Transactional
    public void changePassword(ChangePasswordDTO dto) {
        StaffMember staffMember = findStaffMember(SecurityUtil.getCurrentUserUuid());
        validateNotAdminAccount(staffMember);
        if (!passwordEncoder.matches(dto.getCurrentPassword(), staffMember.getPassword())) {
            throw new BusinessException("Current password is incorrect", ErrorCode.PASSWORD_INCORRECT);
        }
        applyNewPassword(staffMember, dto.getNewPassword());
    }

    // =========================== Helpers ===========================

    public StaffMember findStaffMember(String uuid) {
        return staffMemberRepository.findByUuid(uuid)
                .orElseThrow(() -> new NotFoundException("Staff member not found with id: " + uuid));
    }

    private void validateCanViewStaffMember(StaffMember staffMember) {
        UserPrincipal currentUser = SecurityUtil.getCurrentUser();
        boolean isSelf = currentUser.getUuid().equals(staffMember.getUuid());

        if (staffMember.getPosition().equals(StaffPosition.ADMIN)) {
            if (!isSelf) {
                throw new ForbiddenException("You are not allowed to view this staff member");
            }
            return;
        }

        boolean privileged = currentUser.getPosition().equals(StaffPosition.ADMIN.name()) || currentUser.getPosition().equals(StaffPosition.MANAGER.name());
        if (!privileged && !isSelf) {
            throw new ForbiddenException("You are not allowed to view this staff member");
        }
    }

    private void validateNotAdminAccount(StaffMember staffMember) {
        if (staffMember.getPosition().equals(StaffPosition.ADMIN)) {
            throw new ForbiddenException("The admin account cannot be modified");
        }
    }

    private void validateCanManageManagerTier(StaffPosition currentPosition, StaffPosition resultingPosition) {
        boolean touchesManager = StaffPosition.MANAGER.equals(currentPosition) || StaffPosition.MANAGER.equals(resultingPosition);
        if (!touchesManager) {
            return;
        }
        boolean isAdmin = SecurityUtil.getCurrentUser().getPosition().equals(StaffPosition.ADMIN.name());
        if (!isAdmin) {
            throw new ForbiddenException("Only an administrator can manage manager accounts");
        }
    }

    private void validateStaffMember(StaffMemberDTO dto, String normalizedEmail, String normalizedPhoneNumber, StaffPosition position, Long excludeId) {
        if (position.equals(StaffPosition.ADMIN)) {
            throw new BusinessException("Assigning the admin position is not allowed");
        }
        if (dto.getWorkingHourStart().equals(dto.getWorkingHourEnd())) {
            throw new BusinessException("Working hour end must be different from working hour start");
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

    private void applyNewPassword(StaffMember staffMember, String rawPassword) {
        if (passwordEncoder.matches(rawPassword, staffMember.getPassword())) {
            throw new BusinessException("New password must be different from the current password", ErrorCode.PASSWORD_REUSED);
        }
        staffMember.setPassword(passwordEncoder.encode(rawPassword));
        staffMemberRepository.save(staffMember);
    }

    private void populateFromDto(StaffMember staffMember, StaffMemberDTO dto, Long excludeId) {
        String normalizedEmail = dto.getEmail().trim().toLowerCase();
        String normalizedPhoneNumber = normalizePhoneNumber(dto.getPhoneNumber());
        StaffPosition position = StaffPosition.fromString(dto.getPosition());
        validateStaffMember(dto, normalizedEmail, normalizedPhoneNumber, position, excludeId);

        staffMember.setFirstName(dto.getFirstName());
        staffMember.setLastName(dto.getLastName());
        staffMember.setFullName(User.toFullName(dto.getFirstName(), dto.getLastName()));
        staffMember.setEmail(normalizedEmail);
        staffMember.setPhoneNumber(normalizedPhoneNumber);
        staffMember.setPosition(position);
        staffMember.setEmploymentType(EmploymentType.fromString(dto.getEmploymentType()));
        staffMember.setWorkingDayStart(parseDayOfWeek(dto.getWorkingDayStart(), "workingDayStart"));
        staffMember.setWorkingDayEnd(parseDayOfWeek(dto.getWorkingDayEnd(), "workingDayEnd"));
        staffMember.setWorkingHourStart(parseTime(dto.getWorkingHourStart(), "workingHourStart"));
        staffMember.setWorkingHourEnd(parseTime(dto.getWorkingHourEnd(), "workingHourEnd"));
    }

    private boolean isWorkingDay(StaffMember staffMember, LocalDateTime now) {
        DayOfWeek currentDay = now.getDayOfWeek();

        // A night shift that started yesterday is still the previous day's shift after midnight
        if (staffMember.getWorkingHourStart().isAfter(staffMember.getWorkingHourEnd())
                && now.toLocalTime().isBefore(staffMember.getWorkingHourStart())) {
            currentDay = currentDay.minus(1);
        }

        return isDayInRange(currentDay, staffMember.getWorkingDayStart(), staffMember.getWorkingDayEnd());
    }

    private boolean isDayInRange(DayOfWeek day, DayOfWeek start, DayOfWeek end) {
        if (start.getValue() <= end.getValue()) {
            return day.getValue() >= start.getValue() && day.getValue() <= end.getValue();
        }

        // The working week wraps around the end of the week (e.g. Saturday -> Wednesday)
        return day.getValue() >= start.getValue() || day.getValue() <= end.getValue();
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
