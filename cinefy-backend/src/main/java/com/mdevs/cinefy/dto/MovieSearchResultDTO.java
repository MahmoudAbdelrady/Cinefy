package com.mdevs.cinefy.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MovieSearchResultDTO {

    private Long id;

    private String title;

    private String genre;

    private String rating;

    private String releaseDate;

    private Integer duration;

    private String posterUrl;
}
