package com.mdevs.cinefy.dto.statistics;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StatisticsSummaryDTO {

    private StatisticsPeriodTotalsDTO current;

    private StatisticsPeriodTotalsDTO previous;
}
