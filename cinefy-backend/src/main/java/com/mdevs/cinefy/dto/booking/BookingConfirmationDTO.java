package com.mdevs.cinefy.dto.booking;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mdevs.cinefy.dto.movie.MovieSearchResultDTO;
import com.mdevs.cinefy.entity.enums.PaymentState;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookingConfirmationDTO {

    private String id;

    private PaymentState paymentState;

    private String bookingReference;

    private String qrCode;

    private MovieSearchResultDTO movie;

    private LocalDateTime startDateTime;

    private String hallName;

    private String hallType;

    @JsonProperty("is3D")
    private boolean is3D;

    private List<BookedSeatDTO> seats;

    private BigDecimal totalPrice;
}
