package com.mdevs.cinefy.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
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
