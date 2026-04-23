package com.mdevs.cinefy.dto.showtime;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MovieShowtimesDTO {

    private long numberOfDrafts;

    private List<MovieShowtimeListItemDTO> showtimes;
}
