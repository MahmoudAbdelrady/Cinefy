package com.mdevs.cinefy.shared.security;

import com.mdevs.cinefy.entity.StaffMember;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
@RequiredArgsConstructor
public class UserPrincipal implements UserDetails {

    private final Long id;

    private final String uuid;

    private final String username;

    private final String password;

    private final Collection<? extends GrantedAuthority> authorities;

    public static UserPrincipal fromStaffMember(StaffMember staffMember) {
        return new UserPrincipal(
                staffMember.getId(),
                staffMember.getUuid(),
                staffMember.getUsername(),
                staffMember.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_" + staffMember.getPosition().name())));
    }
}
