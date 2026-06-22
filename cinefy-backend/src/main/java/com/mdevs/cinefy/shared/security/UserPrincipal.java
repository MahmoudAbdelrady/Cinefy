package com.mdevs.cinefy.shared.security;

import com.mdevs.cinefy.entity.Client;
import com.mdevs.cinefy.entity.StaffMember;
import com.mdevs.cinefy.entity.enums.UserType;
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

    private final String email;

    private final String password;

    private final String position;

    private final Collection<? extends GrantedAuthority> authorities;

    private static final String ROLE_PREFIX = "ROLE_";

    @Override
    public String getUsername() {
        return email;
    }

    public static UserPrincipal fromStaffMember(StaffMember staffMember) {
        String position = staffMember.getPosition().name();
        return new UserPrincipal(
                staffMember.getId(),
                staffMember.getUuid(),
                UserType.STAFF_MEMBER,
                staffMember.getEmail(),
                staffMember.getPassword(),
                position,
                List.of(new SimpleGrantedAuthority(ROLE_PREFIX + position)));
    }

    public static UserPrincipal fromClient(Client client) {
        return new UserPrincipal(
                client.getId(),
                client.getUuid(),
                UserType.CLIENT,
                client.getEmail(),
                client.getPassword(),
                null,
                List.of());
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
