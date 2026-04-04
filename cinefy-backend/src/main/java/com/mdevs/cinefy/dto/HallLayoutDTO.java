package com.mdevs.cinefy.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class HallLayoutDTO {

    private int numberOfRows;

    private int seatsPerRow;

    private Map<String, List<String>> layout;

    private List<TicketPricingDTO> ticketPricing;
}
