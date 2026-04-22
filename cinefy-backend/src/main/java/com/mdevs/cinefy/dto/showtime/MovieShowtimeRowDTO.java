package com.mdevs.cinefy.dto.showtime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MovieShowtimeRowDTO {

    private String time;

    private String hallName;

    private String status;

    private int reservedSeats;

    private int totalSeats;
}
