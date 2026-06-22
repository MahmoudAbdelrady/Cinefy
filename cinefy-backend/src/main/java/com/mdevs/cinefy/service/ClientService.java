package com.mdevs.cinefy.service;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;
import com.mdevs.cinefy.dto.client.SignUpDTO;
import com.mdevs.cinefy.entity.Client;
import com.mdevs.cinefy.entity.User;
import com.mdevs.cinefy.repository.ClientRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClientService implements UserDetailsService {

    private final ClientRepository clientRepository;

    private final PasswordEncoder passwordEncoder;

    private static final PhoneNumberUtil PHONE_NUMBER_UTIL = PhoneNumberUtil.getInstance();

    // ========================= Public API =========================

    @Override
    public UserDetails loadUserByUsername(@NonNull String email) throws UsernameNotFoundException {
        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Client not found with email: " + email));
        return UserPrincipal.fromClient(client);
    }

    @Transactional
    public void signUp(SignUpDTO dto) {
        String normalizedEmail = dto.getEmail().trim().toLowerCase();
        String normalizedPhoneNumber = normalizePhoneNumber(dto.getPhoneNumber());
        validateSignUp(normalizedEmail, normalizedPhoneNumber);

        Client client = new Client();
        client.setFirstName(dto.getFirstName());
        client.setLastName(dto.getLastName());
        client.setFullName(User.toFullName(dto.getFirstName(), dto.getLastName()));
        client.setEmail(normalizedEmail);
        client.setPhoneNumber(normalizedPhoneNumber);
        client.setPassword(passwordEncoder.encode(dto.getPassword()));

        clientRepository.save(client);
    }

    // =========================== Helpers ===========================

    private void validateSignUp(String normalizedEmail, String normalizedPhoneNumber) {
        if (clientRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException("Email already in use");
        }
        if (clientRepository.existsByPhoneNumber(normalizedPhoneNumber)) {
            throw new BusinessException("Phone number already in use");
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
}
