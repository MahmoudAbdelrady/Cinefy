package com.mdevs.cinefy.dto.showtime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ShowtimesStatisticsDTO {

    private long totalMovies;

    private long totalShowtimes;

    private long todayShowtimes;
}
