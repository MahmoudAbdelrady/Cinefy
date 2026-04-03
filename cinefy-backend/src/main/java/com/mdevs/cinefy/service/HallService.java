package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.HallDTO;
import com.mdevs.cinefy.dto.TicketPricingDTO;
import com.mdevs.cinefy.entity.*;
import com.mdevs.cinefy.repository.HallRepository;
import com.mdevs.cinefy.repository.HallTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class HallService {

    private final HallRepository hallRepository;
    private final HallTypeRepository hallTypeRepository;

    @Transactional
    public HallDTO createHall(HallDTO dto) {
        validateHall(dto);

        HallType hallType = hallTypeRepository.findByCode(dto.getType())
                .orElseThrow(() -> new IllegalArgumentException("Unknown hall type: " + dto.getType()));

        Hall hall = new Hall(dto.getName());
        hall.setTotalRows(dto.getNumberOfRows());
        hall.setTotalColumns(dto.getSeatsPerRow());
        hall.setStatus(HallStatus.fromCode(dto.getStatus()));
        hall.setType(hallType);
        hall.setSupports3D(dto.isSupports3D());

        for (TicketPricingDTO pricing : dto.getTicketPricing()) {
            HallCategoryPrice categoryPrice = new HallCategoryPrice();
            categoryPrice.setCategory(SeatCategory.fromCode(pricing.getSeatCategory()));
            categoryPrice.setTicketPrice(pricing.getPrice());
            categoryPrice.setHall(hall);
            hall.getCategoryPrices().add(categoryPrice);
        }

        hallRepository.save(hall);
        dto.setHallId(hall.getUuid());
        return dto;
    }

    private void validateHall(HallDTO dto) {
        if (hallRepository.existsByCode(Hall.toCode(dto.getName()))) {
            throw new IllegalArgumentException("A hall with a similar name '" + dto.getName() + "' already exists");
        }

        Set<String> categories = new HashSet<>();
        for (TicketPricingDTO pricing : dto.getTicketPricing()) {
            if (!categories.add(pricing.getSeatCategory())) {
                throw new IllegalArgumentException("Duplicate seat category entry: " + pricing.getSeatCategory());
            }
        }
    }
}
