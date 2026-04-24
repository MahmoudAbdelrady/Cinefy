package com.mdevs.cinefy.dto.hall;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TicketPricingDTO {

    @NotBlank(message = "Seat category is required")
    private String seatCategory;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0", inclusive = false, message = "Ticket price must be greater than 0")
    private BigDecimal price;
}
