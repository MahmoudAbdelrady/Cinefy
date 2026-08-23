package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.statistics.DateRangeDTO;
import com.mdevs.cinefy.dto.statistics.HallPeriodProjection;
import com.mdevs.cinefy.dto.statistics.RevenueProjection;
import com.mdevs.cinefy.dto.statistics.StatisticsPeriodTotalsDTO;
import com.mdevs.cinefy.dto.statistics.StatisticsSummaryDTO;
import com.mdevs.cinefy.dto.statistics.TicketsSoldProjection;
import com.mdevs.cinefy.repository.BookingRepository;
import com.mdevs.cinefy.repository.HallRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final BookingRepository bookingRepository;

    private final HallRepository hallRepository;

    private static final int MAX_RANGE_YEARS = 1;

    private static final int OCCUPANCY_SCALE = 2;

    // ========================= Public API =========================

    public StatisticsSummaryDTO getSummary(DateRangeDTO range) {
        validateDateRange(range);

        LocalDateTime from = range.getFrom().atStartOfDay();
        LocalDateTime to = range.getTo().atTime(LocalTime.MAX);
        long days = ChronoUnit.DAYS.between(range.getFrom(), range.getTo()) + 1;
        LocalDateTime previousFrom = range.getFrom().minusDays(days).atStartOfDay();
        LocalDateTime previousTo = range.getFrom().minusDays(1).atTime(LocalTime.MAX);

        RevenueProjection revenue = bookingRepository.sumRevenueBetween(previousFrom, from, to);
        TicketsSoldProjection ticketsSold = bookingRepository.countTicketsSoldBetween(previousFrom, from, to);

        long currentSeats = 0;
        long previousSeats = 0;
        for (HallPeriodProjection projection : hallRepository.findHallsWithShowtimesBetween(previousFrom, previousTo, from, to)) {
            int capacity = projection.hall().getCapacity();
            if (projection.inCurrent()) {
                currentSeats += capacity;
            }
            if (projection.inPrevious()) {
                previousSeats += capacity;
            }
        }

        StatisticsSummaryDTO dto = new StatisticsSummaryDTO();
        dto.setCurrent(toPeriodTotals(revenue.currentNetRevenue(), revenue.currentRefunded(), ticketsSold.current(), currentSeats));
        dto.setPrevious(toPeriodTotals(revenue.previousNetRevenue(), revenue.previousRefunded(), ticketsSold.previous(), previousSeats));
        return dto;
    }

    // =========================== Helpers ===========================

    public static void validateDateRange(DateRangeDTO range) {
        LocalDate from = range.getFrom();
        LocalDate to = range.getTo();

        if (from.isAfter(to)) {
            throw new BusinessException("From date must not be after to date");
        }

        if (from.plusYears(MAX_RANGE_YEARS).isBefore(to)) {
            throw new BusinessException("The selected range must not exceed " + MAX_RANGE_YEARS + " year");
        }

        LocalDate today = LocalDate.now();
        LocalDate earliestAllowed = today.minusYears(1).withDayOfYear(1);
        if (from.isBefore(earliestAllowed)) {
            throw new BusinessException("The selected range must not start before " + earliestAllowed);
        }

        if (to.isAfter(today)) {
            throw new BusinessException("The selected range must not end after today");
        }
    }

    private StatisticsPeriodTotalsDTO toPeriodTotals(BigDecimal netRevenue, BigDecimal refunded, long ticketsSold, long totalSeats) {
        StatisticsPeriodTotalsDTO totals = new StatisticsPeriodTotalsDTO();
        totals.setNetRevenue(netRevenue);
        totals.setRefunded(refunded);
        totals.setTicketsSold(ticketsSold);
        totals.setOccupancy(toOccupancy(ticketsSold, totalSeats));
        return totals;
    }

    private static BigDecimal toOccupancy(long ticketsSold, long totalSeats) {
        if (totalSeats == 0) {
            return BigDecimal.ZERO.setScale(OCCUPANCY_SCALE);
        }

        return BigDecimal.valueOf(ticketsSold)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(totalSeats), OCCUPANCY_SCALE, RoundingMode.HALF_UP);
    }
}
