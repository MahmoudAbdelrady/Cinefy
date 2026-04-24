package com.mdevs.cinefy.dto.hall;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class HallDTO {

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Number of rows is required")
    @Min(value = 1, message = "Number of rows must be greater than 0")
    private Integer numberOfRows;

    @NotNull(message = "Seats per row is required")
    @Min(value = 1, message = "Seats per row must be greater than 0")
    private Integer seatsPerRow;

    @NotBlank(message = "Status is required")
    private String status;

    @NotBlank(message = "Type is required")
    private String typeId;

    private boolean supports3D;

    private SeatLayoutDTO layout;

    @NotEmpty(message = "At least one ticket pricing entry is required")
    @Valid
    private List<TicketPricingDTO> ticketPricing;
}
