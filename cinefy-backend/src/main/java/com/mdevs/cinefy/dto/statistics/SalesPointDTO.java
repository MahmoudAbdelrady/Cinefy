package com.mdevs.cinefy.dto.statistics;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class SalesPointDTO {

    private LocalDate date;

    private StatisticsPeriodTotalsDTO details;
}
