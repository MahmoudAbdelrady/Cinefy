package com.mdevs.cinefy.service;

import com.mdevs.cinefy.entity.User;
import com.mdevs.cinefy.entity.enums.UserType;
import com.mdevs.cinefy.shared.security.SecurityUtil;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final ClientService clientService;

    private final StaffMemberService staffMemberService;

    // ========================= Public API =========================

    public User loadCurrentUser() {
        return loadUser(SecurityUtil.getCurrentUser());
    }

    public User loadUser(UserPrincipal principal) {
        return principal.getType().equals(UserType.CLIENT)
                ? clientService.findClientByUuid(principal.getUuid())
                : staffMemberService.findStaffMember(principal.getUuid());
    }
}
