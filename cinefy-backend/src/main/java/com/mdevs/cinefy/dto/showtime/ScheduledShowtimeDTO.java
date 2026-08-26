package com.mdevs.cinefy.dto.showtime;

import com.mdevs.cinefy.dto.movie.MovieSearchResultDTO;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ScheduledShowtimeDTO {

    private String id;

    private MovieSearchResultDTO movie;

    private String startsAt;

    private String endsAt;

    private int ticketsSold;

    private int totalSeats;
}
