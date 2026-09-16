package com.mdevs.cinefy.shared.security;

import com.mdevs.cinefy.entity.Client;
import com.mdevs.cinefy.entity.StaffMember;
import com.mdevs.cinefy.entity.enums.UserType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

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

    private final List<SimpleGrantedAuthority> authorities;

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
                buildAuthorities(UserType.STAFF_MEMBER, position));
    }

    public static UserPrincipal fromClient(Client client) {
        return new UserPrincipal(
                client.getId(),
                client.getUuid(),
                UserType.CLIENT,
                client.getEmail(),
                client.getPassword(),
                null,
                buildAuthorities(UserType.CLIENT, null));
    }

    public static UserPrincipal fromJwtClaims(JwtClaims claims) {
        return new UserPrincipal(
                null,
                claims.uuid(),
                claims.userType(),
                null,
                null,
                claims.position(),
                buildAuthorities(claims.userType(), claims.position()));
    }

    private static List<SimpleGrantedAuthority> buildAuthorities(UserType type, String position) {
        String role = type.equals(UserType.CLIENT) ? UserType.CLIENT.name() : position;
        return role == null || role.isEmpty()
                ? List.of()
                : List.of(new SimpleGrantedAuthority(role));
    }
}
