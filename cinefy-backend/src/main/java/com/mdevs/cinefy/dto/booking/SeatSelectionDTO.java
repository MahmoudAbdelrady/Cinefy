package com.mdevs.cinefy.dto.booking;

import com.mdevs.cinefy.dto.hall.HallLayoutDTO;
import com.mdevs.cinefy.dto.movie.MovieSearchResultDTO;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class SeatSelectionDTO {

    private MovieSearchResultDTO movie;

    private LocalDateTime startDateTime;

    private String hallName;

    private String hallType;

    private boolean is3D;

    private HallLayoutDTO hallLayout;
}
