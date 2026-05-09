package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.payment.PaymentMethodDTO;
import com.mdevs.cinefy.dto.payment.PaymentMethodStatusRequestDTO;
import com.mdevs.cinefy.dto.payment.PaymentMethodSummaryDTO;
import com.mdevs.cinefy.dto.payment.PaymentMethodTestResultDTO;
import com.mdevs.cinefy.dto.payment.TestConnectionRequestDTO;
import com.mdevs.cinefy.entity.*;
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
        return paymentMethodRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toSummaryDTO)
                .toList();
    }

    @Transactional
    public PaymentMethodSummaryDTO createPaymentMethod(PaymentMethodDTO dto) {
        validatePaymentMethod(dto);

        PaymentMethod paymentMethod = new PaymentMethod();
        applyDtoToEntity(paymentMethod, dto);
        paymentMethod.setCredentialsRotatedAt(LocalDateTime.now());

        if (dto.isConnectionTested()) {
            runConnectionTest(paymentMethod);
        }

        paymentMethodRepository.save(paymentMethod);
        return toSummaryDTO(paymentMethod);
    }

    @Transactional
    public PaymentMethodSummaryDTO updatePaymentMethod(String uuid, PaymentMethodDTO dto) {
        PaymentMethod paymentMethod = findPaymentMethod(uuid);
        validatePaymentMethod(dto);

        boolean credentialsChanged = !credentialCipher.decrypt(paymentMethod.getSecretKey()).equals(dto.getSecretKey())
                || !credentialCipher.decrypt(paymentMethod.getHmacKey()).equals(dto.getHmacSecret())
                || paymentMethod.getIntegrationId() != dto.getIntegrationId();

        applyDtoToEntity(paymentMethod, dto);

        if (credentialsChanged) {
            paymentMethod.setCredentialsRotatedAt(LocalDateTime.now());
        }

        if (dto.isConnectionTested()) {
            runConnectionTest(paymentMethod);
        } else if (credentialsChanged) {
            paymentMethod.setTestStatus(PaymentMethodTestStatus.UNTESTED);
            paymentMethod.setTestFailureReason(null);
            paymentMethod.setTestedAt(null);
        }

        paymentMethodRepository.save(paymentMethod);
        return toSummaryDTO(paymentMethod);
    }

    @Transactional
    public void deletePaymentMethod(String uuid) {
        PaymentMethod paymentMethod = findPaymentMethod(uuid);
        // TODO: when status == ACTIVE, check if there are active bookings tied to this payment method and throw BusinessException to prevent deletion.
        paymentMethodRepository.delete(paymentMethod);
    }

    public void testConnection(TestConnectionRequestDTO dto) {
        paymobClient.testConnection(dto);
    }

    @Transactional
    public PaymentMethodTestResultDTO testPaymentMethodConnection(String uuid) {
        PaymentMethod paymentMethod = findPaymentMethod(uuid);
        runConnectionTest(paymentMethod);
        paymentMethodRepository.save(paymentMethod);

        PaymentMethodTestResultDTO resultDTO = new PaymentMethodTestResultDTO();
        resultDTO.setId(paymentMethod.getUuid());
        resultDTO.setTestStatus(paymentMethod.getTestStatus().name());
        resultDTO.setTestFailureReason(paymentMethod.getTestFailureReason());
        return resultDTO;
    }

    @Transactional
    public void updatePaymentMethodStatus(String uuid, PaymentMethodStatusRequestDTO dto) {
        PaymentMethod paymentMethod = findPaymentMethod(uuid);
        PaymentMethodStatus newStatus = PaymentMethodStatus.fromString(dto.getStatus());
        if (paymentMethod.getStatus().equals(newStatus)) {
            return;
        }
        if (newStatus.equals(PaymentMethodStatus.DRAFT)) {
            throw new BusinessException("Cannot set a payment method to draft");
        }
        if (newStatus.equals(PaymentMethodStatus.INACTIVE) && paymentMethod.getStatus().equals(PaymentMethodStatus.DRAFT)) {
            throw new BusinessException("Cannot set a draft payment method to inactive");
        }
        paymentMethod.setStatus(newStatus);
        paymentMethodRepository.save(paymentMethod);
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

        // TODO: Other validations will be added later
    }

    private void runConnectionTest(PaymentMethod paymentMethod) {
        paymentMethod.setTestedAt(LocalDateTime.now());
        try {
            paymobClient.testConnection(new TestConnectionRequestDTO(
                    credentialCipher.decrypt(paymentMethod.getSecretKey()),
                    paymentMethod.getIntegrationId(),
                    paymentMethod.getCurrency()
            ));
            paymentMethod.setTestStatus(PaymentMethodTestStatus.SUCCESS);
            paymentMethod.setTestFailureReason(null);
        } catch (Exception e) {
            paymentMethod.setTestStatus(PaymentMethodTestStatus.FAILURE);
            paymentMethod.setTestFailureReason(e.getMessage());
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
        dto.setTestedAt(entity.getTestedAt());
        dto.setSuccessRate("0.0%"); // TODO: compute from orders table once it exists
        dto.setCredentialsRotatedAt(entity.getCredentialsRotatedAt());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
