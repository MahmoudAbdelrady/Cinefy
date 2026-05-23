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

    private final UserType type;

    private final String username;

    private final String password;

    private final String position;

    private final Collection<? extends GrantedAuthority> authorities;

    private static final String ROLE_PREFIX = "ROLE_";

    public static UserPrincipal fromStaffMember(StaffMember staffMember) {
        String position = staffMember.getPosition().name();
        return new UserPrincipal(
                staffMember.getId(),
                staffMember.getUuid(),
                UserType.STAFF_MEMBER,
                staffMember.getUsername(),
                staffMember.getPassword(),
                position,
                List.of(new SimpleGrantedAuthority(ROLE_PREFIX + position)));
    }

    public static UserPrincipal fromJwtClaims(JwtClaims claims) {
        return new UserPrincipal(
                null,
                claims.uuid(),
                claims.userType(),
                null,
                null,
                claims.position(),
                List.of(new SimpleGrantedAuthority(ROLE_PREFIX + claims.position())));
    }
}
