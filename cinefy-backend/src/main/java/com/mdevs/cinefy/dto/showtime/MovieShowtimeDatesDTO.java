package com.mdevs.cinefy.dto.showtime;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MovieShowtimeDatesDTO {

    private Long numberOfDrafts;

    private Long numberOfCommitted;

    private List<String> dates;
}
