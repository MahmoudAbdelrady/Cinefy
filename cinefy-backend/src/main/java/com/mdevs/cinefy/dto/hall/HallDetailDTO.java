package com.mdevs.cinefy.dto.hall;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class HallDetailDTO {

    private String id;

    private String name;

    private int numberOfRows;

    private int seatsPerRow;

    private String status;

    private HallTypeDTO type;

    private boolean supports3D;

    private SeatLayoutDTO layout;

    private List<TicketPricingDTO> ticketPricing;
}
