package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.staff.CurrentStaffMemberDTO;
import com.mdevs.cinefy.dto.staff.PositionCoverageDTO;
import com.mdevs.cinefy.dto.staff.StaffMemberDTO;
import com.mdevs.cinefy.dto.staff.StaffMemberDetailDTO;
import com.mdevs.cinefy.dto.staff.StaffMemberSummaryDTO;
import com.mdevs.cinefy.service.StaffMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/staff")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class StaffMemberController {

    private final StaffMemberService staffMemberService;

    @GetMapping
    public ResponseEntity<Page<StaffMemberSummaryDTO>> getStaffMembers(@RequestParam(required = false) String name,
                                                                       @RequestParam(required = false) String position,
                                                                       Pageable pageable) {
        return ResponseEntity.ok(staffMemberService.getStaffMembers(name, position, pageable));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CurrentStaffMemberDTO> getCurrentStaffMember() {
        return ResponseEntity.ok(staffMemberService.getCurrentStaffMember());
    }

    @GetMapping("/position-coverage")
    public ResponseEntity<PositionCoverageDTO> getPositionCoverage() {
        return ResponseEntity.ok(staffMemberService.getPositionCoverage());
    }

    @GetMapping("/{uuid}")
    public ResponseEntity<StaffMemberDetailDTO> getStaffMember(@PathVariable String uuid) {
        return ResponseEntity.ok(staffMemberService.getStaffMember(uuid));
    }

    @PostMapping
    public ResponseEntity<StaffMemberSummaryDTO> createStaffMember(@Valid @RequestBody StaffMemberDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(staffMemberService.createStaffMember(dto));
    }

    @PutMapping("/{uuid}")
    public ResponseEntity<StaffMemberSummaryDTO> updateStaffMember(@PathVariable String uuid, @Valid @RequestBody StaffMemberDTO dto) {
        return ResponseEntity.ok(staffMemberService.updateStaffMember(uuid, dto));
    }

    @DeleteMapping("/{uuid}")
    public ResponseEntity<Void> deleteStaffMember(@PathVariable String uuid) {
        staffMemberService.deleteStaffMember(uuid);
        return ResponseEntity.noContent().build();
    }
}
