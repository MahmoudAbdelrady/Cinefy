package com.mdevs.cinefy.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ShowtimeSummaryDTO {

    private String id;

    private MovieSearchResultDTO movie;

    private String hallId;

    private String hallName;

    private LocalDateTime startDateTime;

    private String status;
}
