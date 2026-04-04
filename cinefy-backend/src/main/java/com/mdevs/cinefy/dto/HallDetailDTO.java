package com.mdevs.cinefy.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

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

    private Map<String, List<String>> layout;

    private List<TicketPricingDTO> ticketPricing;
}
