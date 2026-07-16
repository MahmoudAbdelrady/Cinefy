package com.mdevs.cinefy.dto.booking;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mdevs.cinefy.dto.hall.HallLayoutDTO;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SeatSelectionDTO {

    private String movieTitle;

    private LocalDateTime startDateTime;

    private String hallName;

    private String hallType;

    @JsonProperty("is3D")
    private boolean is3D;

    private boolean fullyBooked;

    private HallLayoutDTO hallLayout;

    private ActiveBookingDTO activeBooking;
}
