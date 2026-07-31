package com.mdevs.cinefy.dto.booking;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mdevs.cinefy.dto.movie.MovieSearchResultDTO;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class BookingDetailDTO {

    private String id;

    private LocalDateTime expiresAt;

    private MovieSearchResultDTO movie;

    private String showtimeId;

    private LocalDateTime startDateTime;

    private String hallName;

    private String hallType;

    @JsonProperty("is3D")
    private boolean is3D;

    private List<BookedSeatDTO> seats;

    private BigDecimal totalPrice;
}
