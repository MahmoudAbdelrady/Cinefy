package com.mdevs.cinefy.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HallStatisticsDTO {

    private Long totalHalls;

    private Long activeHalls;

    private Long totalCapacity;
}
