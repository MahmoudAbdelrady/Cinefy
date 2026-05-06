package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.payment.CreatePaymentMethodDTO;
import com.mdevs.cinefy.dto.payment.PaymentMethodSummaryDTO;
import com.mdevs.cinefy.entity.PaymentMethod;
import com.mdevs.cinefy.entity.PaymentMethodStatus;
import com.mdevs.cinefy.entity.PaymentMethodType;
import com.mdevs.cinefy.entity.PaymentProvider;
import com.mdevs.cinefy.repository.PaymentMethodRepository;
import com.mdevs.cinefy.shared.security.CredentialCipher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentMethodService {

    private final PaymentMethodRepository paymentMethodRepository;

    private final CredentialCipher credentialCipher;

    // ========================= Public API =========================

    public List<PaymentMethodSummaryDTO> getPaymentMethods() {
        return paymentMethodRepository.findAll().stream()
                .map(this::toSummaryDTO)
                .toList();
    }

    @Transactional
    public PaymentMethodSummaryDTO createPaymentMethod(CreatePaymentMethodDTO dto) {
        validatePaymentMethod(dto);

        PaymentMethod entity = new PaymentMethod();
        applyCreateDtoToEntity(entity, dto);

        if (dto.isConnectionTested()) {
            entity.setTestedAt(LocalDateTime.now());
            // TODO: call PaymobClient.testConnection(dto.getSecretKey(), dto.getIntegrationId())
            //       — when SUCCESS: setTestStatus(SUCCESS), setCurrency("EGP"), setCredentialsRotatedAt(now())
            //       — when FAILURE (bad creds, network, Paymob down): setTestStatus(FAILURE)
            // For now, leave testStatus at the entity default (UNTESTED); the follow-up plan wires real testing.
        }

        paymentMethodRepository.save(entity);
        return toSummaryDTO(entity);
    }

    // =========================== Helpers ===========================

    private void validatePaymentMethod(CreatePaymentMethodDTO dto) {
        // @TODO --> Validations will be added later
    }

    private void applyCreateDtoToEntity(PaymentMethod entity, CreatePaymentMethodDTO dto) {
        entity.setName(dto.getName());
        entity.setStatus(PaymentMethodStatus.DRAFT);
        entity.setProvider(PaymentProvider.PAYMOB);
        entity.setType(PaymentMethodType.fromString(dto.getType()));
        entity.setTest(dto.isTest());
        entity.setSecretKey(credentialCipher.encrypt(dto.getSecretKey()));
        entity.setHmacKey(credentialCipher.encrypt(dto.getHmacSecret()));
        entity.setPublicKey(dto.getPublicKey());
        entity.setIntegrationId(dto.getIntegrationId());
        entity.setIframeId(dto.getIframeId());
    }

    private PaymentMethodSummaryDTO toSummaryDTO(PaymentMethod entity) {
        PaymentMethodSummaryDTO dto = new PaymentMethodSummaryDTO();
        dto.setId(entity.getUuid());
        dto.setName(entity.getName());
        dto.setStatus(entity.getStatus().name());
        dto.setType(entity.getType().name());
        dto.setTest(entity.isTest());
        dto.setCurrency(entity.getCurrency());
        dto.setPublicKey(entity.getPublicKey());
        dto.setIntegrationId(entity.getIntegrationId());
        dto.setIframeId(entity.getIframeId());
        dto.setTestStatus(entity.getTestStatus().name());
        dto.setPublishedAt(entity.getPublishedAt());
        dto.setCredentialsRotatedAt(entity.getCredentialsRotatedAt());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
