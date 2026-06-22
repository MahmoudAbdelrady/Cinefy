package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.auth.LoginDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.shared.security.JwtClaims;
import com.mdevs.cinefy.shared.security.JwtUtil;
import com.mdevs.cinefy.shared.security.TokenType;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ClientAuthService {

    @Qualifier("clientAuthenticationManager")
    private final AuthenticationManager authenticationManager;

    private final JwtUtil jwtUtil;

    public TokenPairDTO login(LoginDTO dto) {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(dto.getEmail().trim().toLowerCase(), dto.getPassword()));
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        JwtClaims jwtClaims = JwtClaims.fromPrincipal(principal);

        String accessToken = jwtUtil.generateToken(TokenType.ACCESS, jwtClaims);
        String refreshToken = jwtUtil.generateToken(TokenType.REFRESH, jwtClaims);
        return new TokenPairDTO(accessToken, refreshToken);
    }
}
