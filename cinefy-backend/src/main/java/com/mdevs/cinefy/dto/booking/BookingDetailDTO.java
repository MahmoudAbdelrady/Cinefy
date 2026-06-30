package com.mdevs.cinefy.dto.booking;

import com.mdevs.cinefy.dto.movie.MovieSearchResultDTO;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class BookingDetailDTO {

    private String id;

    private String bookingReference;

    private LocalDateTime expiresAt;

    private MovieSearchResultDTO movie;

    private String hallName;

    private String hallType;

    private List<BookedSeatDTO> seats;
}
