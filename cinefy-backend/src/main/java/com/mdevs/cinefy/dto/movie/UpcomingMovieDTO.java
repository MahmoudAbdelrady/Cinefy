package com.mdevs.cinefy.dto.movie;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpcomingMovieDTO extends MovieBaseDTO {

    private boolean isAnnounced;

    private boolean isHighlighted;

    private boolean hasCommittedShowtimes;
}
