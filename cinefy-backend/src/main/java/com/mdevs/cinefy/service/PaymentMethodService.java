package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.payment.CreatePaymentMethodDTO;
import com.mdevs.cinefy.dto.payment.PaymentMethodSummaryDTO;
import com.mdevs.cinefy.dto.payment.TestConnectionRequestDTO;
import com.mdevs.cinefy.entity.PaymentMethod;
import com.mdevs.cinefy.entity.PaymentMethodStatus;
import com.mdevs.cinefy.entity.PaymentMethodTestStatus;
import com.mdevs.cinefy.entity.PaymentMethodType;
import com.mdevs.cinefy.entity.PaymentProvider;
import com.mdevs.cinefy.repository.PaymentMethodRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import com.mdevs.cinefy.shared.payment.PaymobClient;
import com.mdevs.cinefy.shared.security.CredentialCipher;
import lombok.RequiredArgsConstructor;

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

    public void testConnection(TestConnectionRequestDTO dto) {
        paymobClient.testConnection(dto);
    }

    @Transactional
    public PaymentMethodSummaryDTO createPaymentMethod(CreatePaymentMethodDTO dto) {
        validatePaymentMethod(dto);

        PaymentMethod entity = new PaymentMethod();
        applyCreateDtoToEntity(entity, dto);

        if (dto.isConnectionTested()) {
            entity.setTestedAt(LocalDateTime.now());
            try {
                paymobClient.testConnection(new TestConnectionRequestDTO(dto.getSecretKey(), dto.getIntegrationId(), dto.getCurrency()));
                entity.setTestStatus(PaymentMethodTestStatus.SUCCESS);
                entity.setCredentialsRotatedAt(LocalDateTime.now());
            } catch (Exception e) {
                entity.setTestStatus(PaymentMethodTestStatus.FAILURE);
            }
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

    private void validatePaymentMethod(CreatePaymentMethodDTO dto) {
        try {
            Currency.getInstance(dto.getCurrency().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Invalid currency code");
        }

        // @TODO --> Other validations will be added later
    }

    private void applyCreateDtoToEntity(PaymentMethod entity, CreatePaymentMethodDTO dto) {
        entity.setName(dto.getName());
        entity.setStatus(PaymentMethodStatus.DRAFT);
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
        dto.setPublishedAt(entity.getPublishedAt());
        dto.setCredentialsRotatedAt(entity.getCredentialsRotatedAt());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
