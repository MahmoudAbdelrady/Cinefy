package com.mdevs.cinefy.dto.showtime;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mdevs.cinefy.dto.hall.HallReferenceDTO;
import com.mdevs.cinefy.dto.movie.MovieSummaryDTO;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ShowtimeSummaryDTO {

    private String id;

    private MovieSummaryDTO movie;

    private HallReferenceDTO hall;

    private LocalDateTime startDateTime;

    private String status;

    private String specialNotes;

    @JsonProperty("is3D")
    private boolean is3D;

    private int bookedSeats;

    private int totalSeats;
}
