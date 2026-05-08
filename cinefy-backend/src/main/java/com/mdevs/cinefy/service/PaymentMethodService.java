package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.payment.PaymentMethodDTO;
import com.mdevs.cinefy.dto.payment.PaymentMethodSummaryDTO;
import com.mdevs.cinefy.dto.payment.TestConnectionRequestDTO;
import com.mdevs.cinefy.entity.PaymentMethod;
import com.mdevs.cinefy.entity.PaymentMethodTestStatus;
import com.mdevs.cinefy.entity.PaymentMethodType;
import com.mdevs.cinefy.entity.PaymentProvider;
import com.mdevs.cinefy.repository.PaymentMethodRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import com.mdevs.cinefy.shared.payment.PaymobClient;
import com.mdevs.cinefy.shared.security.CredentialCipher;
import lombok.RequiredArgsConstructor;

import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Currency;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentMethodService {

    private final PaymentMethodRepository paymentMethodRepository;

    private final CredentialCipher credentialCipher;

    private final PaymobClient paymobClient;

    // ========================= Public API =========================

    public List<PaymentMethodSummaryDTO> getPaymentMethods() {
        return paymentMethodRepository.findAll().stream()
                .map(this::toSummaryDTO)
                .toList();
    }

    @Transactional
    public void testConnection(TestConnectionRequestDTO dto) {
        if (dto.getPaymentMethodId() != null) {
            PaymentMethod entity = findPaymentMethod(dto.getPaymentMethodId());
            runConnectionTest(entity);
            paymentMethodRepository.save(entity);
            return;
        }

        if (StringUtils.isEmpty(dto.getSecretKey()) || dto.getIntegrationId() == null || StringUtils.isEmpty(dto.getCurrency())) {
            throw new BusinessException("Secret key, integration ID, and currency are required to test the connection");
        }
        paymobClient.testConnection(dto);
    }

    @Transactional
    public PaymentMethodSummaryDTO createPaymentMethod(PaymentMethodDTO dto) {
        validatePaymentMethod(dto);

        PaymentMethod entity = new PaymentMethod();
        applyDtoToEntity(entity, dto);

        if (dto.isConnectionTested()) {
            runConnectionTest(entity);
            if (entity.getTestStatus().equals(PaymentMethodTestStatus.SUCCESS)) {
                entity.setCredentialsRotatedAt(LocalDateTime.now());
            }
        }

        paymentMethodRepository.save(entity);
        return toSummaryDTO(entity);
    }

    @Transactional
    public PaymentMethodSummaryDTO updatePaymentMethod(String uuid, PaymentMethodDTO dto) {
        PaymentMethod entity = findPaymentMethod(uuid);
        validatePaymentMethod(dto);

        boolean credentialsChanged = !credentialCipher.decrypt(entity.getSecretKey()).equals(dto.getSecretKey())
                || !credentialCipher.decrypt(entity.getHmacKey()).equals(dto.getHmacSecret())
                || entity.getIntegrationId() != dto.getIntegrationId();

        applyDtoToEntity(entity, dto);

        if (dto.isConnectionTested()) {
            runConnectionTest(entity);
            if (credentialsChanged && entity.getTestStatus().equals(PaymentMethodTestStatus.SUCCESS)) {
                entity.setCredentialsRotatedAt(LocalDateTime.now());
            }
        } else if (credentialsChanged) {
            entity.setTestStatus(PaymentMethodTestStatus.UNTESTED);
            entity.setTestFailureReason(null);
            entity.setTestedAt(null);
        }

        paymentMethodRepository.save(entity);
        return toSummaryDTO(entity);
    }

    @Transactional
    public void deletePaymentMethod(String uuid) {
        PaymentMethod entity = findPaymentMethod(uuid);
        // TODO: when status == ACTIVE, check if there are active bookings tied to this payment method
        //       and throw BusinessException to prevent deletion.
        paymentMethodRepository.delete(entity);
    }

    // =========================== Helpers ===========================

    private PaymentMethod findPaymentMethod(String uuid) {
        return paymentMethodRepository.findByUuid(uuid)
                .orElseThrow(() -> new NotFoundException("Payment method not found with id: " + uuid));
    }

    private void validatePaymentMethod(PaymentMethodDTO dto) {
        try {
            Currency.getInstance(dto.getCurrency().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Invalid currency code");
        }

        // @TODO --> Other validations will be added later
    }

    private void runConnectionTest(PaymentMethod entity) {
        entity.setTestedAt(LocalDateTime.now());
        try {
            paymobClient.testConnection(new TestConnectionRequestDTO(
                    null,
                    credentialCipher.decrypt(entity.getSecretKey()),
                    entity.getIntegrationId(),
                    entity.getCurrency()
            ));
            entity.setTestStatus(PaymentMethodTestStatus.SUCCESS);
            entity.setTestFailureReason(null);
        } catch (Exception e) {
            entity.setTestStatus(PaymentMethodTestStatus.FAILURE);
            entity.setTestFailureReason(e.getMessage());
        }
    }

    private void applyDtoToEntity(PaymentMethod entity, PaymentMethodDTO dto) {
        entity.setName(dto.getName());
        entity.setProvider(PaymentProvider.PAYMOB);
        entity.setType(PaymentMethodType.fromString(dto.getType()));
        entity.setTest(dto.isTest());
        entity.setCurrency(dto.getCurrency().toUpperCase());
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
        dto.setTestFailureReason(entity.getTestFailureReason());
        dto.setPublishedAt(entity.getPublishedAt());
        dto.setCredentialsRotatedAt(entity.getCredentialsRotatedAt());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
