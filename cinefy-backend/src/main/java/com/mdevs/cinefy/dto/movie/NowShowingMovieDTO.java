package com.mdevs.cinefy.dto.movie;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NowShowingMovieDTO {

    private Long id;

    private String title;

    private String genre;

    private String releaseDate;

    private String posterUrl;

    private String backdropUrl;

    @JsonProperty("is3D")
    private boolean is3D;
}
