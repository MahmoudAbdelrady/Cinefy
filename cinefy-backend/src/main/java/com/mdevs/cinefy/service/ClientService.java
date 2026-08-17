package com.mdevs.cinefy.service;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;
import com.mdevs.cinefy.dto.client.ChangeClientPasswordDTO;
import com.mdevs.cinefy.dto.client.CurrentClientDTO;
import com.mdevs.cinefy.dto.client.SignUpDTO;
import com.mdevs.cinefy.dto.client.UpdateClientProfileDTO;
import com.mdevs.cinefy.entity.Client;
import com.mdevs.cinefy.entity.User;
import com.mdevs.cinefy.repository.ClientRepository;
import com.mdevs.cinefy.shared.exception.ErrorCode;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import com.mdevs.cinefy.shared.oauth.OAuthRegistrationToken;
import com.mdevs.cinefy.shared.security.SecurityUtil;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
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

    public CurrentClientDTO getCurrentClient() {
        Client client = findClientByUuid(SecurityUtil.getCurrentUserUuid());
        return toCurrentClientDTO(client);
    }

    @Transactional
    public Client createClient(SignUpDTO dto) {
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

        return clientRepository.save(client);
    }

    @Transactional
    public Client createOAuthClient(OAuthRegistrationToken token, String phoneNumber) {
        String normalizedEmail = token.email().trim().toLowerCase();
        String normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
        validateSignUp(normalizedEmail, normalizedPhoneNumber);

        Client client = new Client();
        client.setFirstName(token.firstName());
        client.setLastName(token.lastName());
        client.setFullName(User.toFullName(token.firstName(), token.lastName()));
        client.setEmail(normalizedEmail);
        client.setPhoneNumber(normalizedPhoneNumber);
        client.setVerified(true);

        return clientRepository.save(client);
    }

    @Transactional
    public CurrentClientDTO updateCurrentClient(UpdateClientProfileDTO dto) {
        Client client = findClientByUuid(SecurityUtil.getCurrentUserUuid());
        String normalizedPhoneNumber = normalizePhoneNumber(dto.getPhoneNumber());
        if (clientRepository.existsByPhoneNumberAndIdNot(normalizedPhoneNumber, client.getId())) {
            throw new BusinessException("Phone number already in use");
        }

        client.setFirstName(dto.getFirstName());
        client.setLastName(dto.getLastName());
        client.setFullName(User.toFullName(dto.getFirstName(), dto.getLastName()));
        client.setPhoneNumber(normalizedPhoneNumber);

        clientRepository.save(client);
        return toCurrentClientDTO(client);
    }

    @Transactional
    public Client markVerified(Long userId) {
        Client client = findClientById(userId);
        if (client.isVerified()) {
            return client;
        }
        client.setVerified(true);
        return clientRepository.save(client);
    }

    @Transactional
    public void updatePassword(Long id, String rawPassword) {
        Client client = findClientById(id);
        applyNewPassword(client, rawPassword);
    }

    @Transactional
    public void changePassword(ChangeClientPasswordDTO dto) {
        Client client = findClientByUuid(SecurityUtil.getCurrentUserUuid());
        if (client.hasPassword()) {
            if (StringUtils.isEmpty(dto.getCurrentPassword())) {
                throw new BusinessException("Current password is required");
            }
            if (!passwordEncoder.matches(dto.getCurrentPassword(), client.getPassword())) {
                throw new BusinessException("Current password is incorrect", ErrorCode.PASSWORD_INCORRECT);
            }
        }
        applyNewPassword(client, dto.getNewPassword());
    }

    // =========================== Helpers ===========================

    public Client findClientByUuid(String uuid) {
        return clientRepository.findByUuid(uuid)
                .orElseThrow(() -> new NotFoundException("Client not found"));
    }

    private Client findClientById(Long id) {
        Client client = clientRepository.findOne(id);
        if (client == null) {
            throw new NotFoundException("Client not found");
        }
        return client;
    }

    private void validateSignUp(String normalizedEmail, String normalizedPhoneNumber) {
        if (clientRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException("Email already in use");
        }
        if (clientRepository.existsByPhoneNumber(normalizedPhoneNumber)) {
            throw new BusinessException("Phone number already in use");
        }
    }

    private void applyNewPassword(Client client, String rawPassword) {
        if (passwordEncoder.matches(rawPassword, client.getPassword())) {
            throw new BusinessException("New password must be different from the current password", ErrorCode.PASSWORD_REUSED);
        }
        client.setPassword(passwordEncoder.encode(rawPassword));
        clientRepository.save(client);
    }

    private CurrentClientDTO toCurrentClientDTO(Client client) {
        return new CurrentClientDTO(
                client.getUuid(),
                client.getFirstName(),
                client.getLastName(),
                client.getFullName(),
                client.getEmail(),
                client.getPhoneNumber(),
                client.hasPassword());
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
