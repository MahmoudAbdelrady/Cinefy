package com.mdevs.cinefy.dto.hall;

import com.mdevs.cinefy.shared.validation.ValidationPatterns;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class HallDTO {

    @NotBlank(message = "Name is required")
    @Size(max = 50, message = "Name must not exceed 50 characters")
    @Pattern(regexp = ValidationPatterns.RESOURCE_NAME, message = ValidationPatterns.RESOURCE_NAME_MESSAGE)
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
