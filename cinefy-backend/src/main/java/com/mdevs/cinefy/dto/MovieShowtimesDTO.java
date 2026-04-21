package com.mdevs.cinefy.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MovieShowtimesDTO {

    private long numberOfAllDrafts;

    private long numberOfCurrentDateDrafts;

    private List<MovieShowtimeRowDTO> showtimes;
}
