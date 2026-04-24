package com.mdevs.cinefy.dto.showtime;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mdevs.cinefy.dto.hall.HallReferenceDTO;
import com.mdevs.cinefy.dto.movie.MovieDetailDTO;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ShowtimeSummaryDTO {

    private String id;

    private MovieDetailDTO movie;

    private HallReferenceDTO hall;

    private LocalDateTime startDateTime;

    private String status;
}
