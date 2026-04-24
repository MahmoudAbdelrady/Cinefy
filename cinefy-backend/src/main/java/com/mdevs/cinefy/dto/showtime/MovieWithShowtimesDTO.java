package com.mdevs.cinefy.dto.showtime;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mdevs.cinefy.dto.movie.MovieDetailDTO;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MovieWithShowtimesDTO {

    private long totalShowtimes;

    private long totalDraftShowtimes;

    private MovieDetailDTO movieDetails;
}
