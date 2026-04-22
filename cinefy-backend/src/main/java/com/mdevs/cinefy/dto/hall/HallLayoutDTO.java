package com.mdevs.cinefy.dto.hall;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class HallLayoutDTO {

    private int numberOfRows;

    private int seatsPerRow;

    private SeatLayoutDTO layout;

    private List<TicketPricingDTO> ticketPricing;
}
