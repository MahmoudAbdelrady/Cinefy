package com.mdevs.cinefy.dto.showtime;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class PublishShowtimesDTO {

    private String showtimeId;

    private Long movieId;

    private LocalDate date;
}
