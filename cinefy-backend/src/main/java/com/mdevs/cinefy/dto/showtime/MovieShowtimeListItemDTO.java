package com.mdevs.cinefy.dto.showtime;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mdevs.cinefy.dto.hall.HallReferenceDTO;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MovieShowtimeListItemDTO {

    private String id;

    private String time;

    private HallReferenceDTO hall;

    private String status;

    private String specialNotes;

    @JsonProperty("is3D")
    private boolean is3D;

    private int bookedSeats;

    private int myOnHoldSeats;

    private int totalSeats;
}
