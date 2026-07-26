package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.payment.CardTokenCallbackDTO;
import com.mdevs.cinefy.dto.payment.ClientPaymentMethodDTO;
import com.mdevs.cinefy.entity.Client;
import com.mdevs.cinefy.entity.ClientPaymentMethod;
import com.mdevs.cinefy.repository.ClientPaymentMethodRepository;
import com.mdevs.cinefy.repository.ClientRepository;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClientPaymentMethodService {

    private final ClientPaymentMethodRepository clientPaymentMethodRepository;

    private final ClientRepository clientRepository;

    private final CurrentUserService currentUserService;

    // ========================= Public API =========================

    public List<ClientPaymentMethodDTO> getCurrentClientPaymentMethods() {
        Long clientId = currentUserService.loadCurrentUser().getId();
        return clientPaymentMethodRepository.findAllByClientId(clientId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public ClientPaymentMethod findByUuid(String uuid) {
        return clientPaymentMethodRepository.findByUuid(uuid)
                .orElseThrow(() -> new NotFoundException("Payment method not found"));
    }

    @Transactional
    public void createMethod(CardTokenCallbackDTO callback) {
        Client client = clientRepository.findByEmail(callback.email()).orElse(null);
        if (client == null) {
            log.warn("Card token callback for an unknown client email; skipping");
            return;
        }

        if (clientPaymentMethodRepository.existsByToken(callback.token())) {
            log.warn("Card token callback for an already saved token; skipping");
            return;
        }

        ClientPaymentMethod paymentMethod = new ClientPaymentMethod();
        paymentMethod.setClient(client);
        paymentMethod.setToken(callback.token());
        paymentMethod.setMaskedPan(callback.maskedPan());
        paymentMethod.setCardBrand(callback.brand());

        clientPaymentMethodRepository.save(paymentMethod);
    }

    // =========================== Helpers ===========================

    private ClientPaymentMethodDTO toDTO(ClientPaymentMethod paymentMethod) {
        return new ClientPaymentMethodDTO(
                paymentMethod.getUuid(),
                paymentMethod.getCardBrand(),
                paymentMethod.getMaskedPan());
    }
}
