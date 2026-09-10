package com.mdevs.cinefy.service;

import com.mdevs.cinefy.projection.statistics.DailyHallProjection;
import com.mdevs.cinefy.projection.statistics.DailyRevenueProjection;
import com.mdevs.cinefy.projection.statistics.DailyTicketsSoldProjection;
import com.mdevs.cinefy.dto.statistics.DateRangeDTO;
import com.mdevs.cinefy.projection.statistics.HallPeriodProjection;
import com.mdevs.cinefy.projection.statistics.MovieHallProjection;
import com.mdevs.cinefy.dto.statistics.MoviePerformanceDTO;
import com.mdevs.cinefy.projection.statistics.MovieRevenueProjection;
import com.mdevs.cinefy.projection.statistics.MovieTicketsSoldProjection;
import com.mdevs.cinefy.projection.statistics.RevenueProjection;
import com.mdevs.cinefy.dto.statistics.SalesPointDTO;
import com.mdevs.cinefy.dto.statistics.StatisticsPeriodTotalsDTO;
import com.mdevs.cinefy.dto.statistics.StatisticsSummaryDTO;
import com.mdevs.cinefy.projection.statistics.TicketsSoldProjection;
import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
import com.mdevs.cinefy.repository.BookingRepository;
import com.mdevs.cinefy.repository.HallRepository;
import com.mdevs.cinefy.repository.TmdbMovieRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final BookingRepository bookingRepository;

    private final HallRepository hallRepository;

    private final TmdbMovieRepository tmdbMovieRepository;

    private static final int MAX_RANGE_YEARS = 1;

    private static final int OCCUPANCY_SCALE = 2;

    // ========================= Public API =========================

    public StatisticsSummaryDTO getSummary(DateRangeDTO range) {
        validateDateRange(range);

        LocalDateTime from = range.getFrom().atStartOfDay();
        LocalDateTime to = range.getTo().atTime(LocalTime.MAX);
        long days = ChronoUnit.DAYS.between(range.getFrom(), range.getTo()) + 1;
        LocalDateTime previousFrom = range.getFrom().minusDays(days).atStartOfDay();

        RevenueProjection revenue = bookingRepository.sumRevenueBetween(ShowtimeStatus.REPORTABLE_STATUSES, previousFrom, from, to);
        TicketsSoldProjection ticketsSold = bookingRepository.countTicketsSoldBetween(ShowtimeStatus.REPORTABLE_STATUSES, previousFrom, from, to);

        long currentSeats = 0;
        long previousSeats = 0;
        for (HallPeriodProjection projection : hallRepository.findShowtimeHallsBetween(ShowtimeStatus.REPORTABLE_STATUSES, previousFrom, from, to)) {
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

    public List<SalesPointDTO> getSales(DateRangeDTO range) {
        validateDateRange(range);

        LocalDateTime from = range.getFrom().atStartOfDay();
        LocalDateTime to = range.getTo().atTime(LocalTime.MAX);

        Map<LocalDate, DailyRevenueProjection> revenueByDate = bookingRepository.sumDailyRevenueBetween(ShowtimeStatus.REPORTABLE_STATUSES, from, to)
                .stream()
                .collect(Collectors.toMap(DailyRevenueProjection::date, Function.identity()));
        Map<LocalDate, Long> ticketsByDate = bookingRepository.countDailyTicketsSoldBetween(ShowtimeStatus.REPORTABLE_STATUSES, from, to)
                .stream()
                .collect(Collectors.toMap(DailyTicketsSoldProjection::date, DailyTicketsSoldProjection::ticketsSold));
        Map<LocalDate, Long> seatsByDate = hallRepository.findDailyShowtimeHallsBetween(ShowtimeStatus.REPORTABLE_STATUSES, from, to)
                .stream()
                .collect(Collectors.groupingBy(DailyHallProjection::date,
                        Collectors.summingLong(projection -> projection.hall().getCapacity())));

        List<SalesPointDTO> points = new ArrayList<>();
        for (LocalDate date = range.getFrom(); !date.isAfter(range.getTo()); date = date.plusDays(1)) {
            DailyRevenueProjection revenue = revenueByDate.get(date);
            long ticketsSold = ticketsByDate.getOrDefault(date, 0L);

            SalesPointDTO point = new SalesPointDTO();
            point.setDate(date);
            point.setDetails(toPeriodTotals(
                    revenue == null ? BigDecimal.ZERO : revenue.netRevenue(),
                    revenue == null ? BigDecimal.ZERO : revenue.refunded(),
                    ticketsSold,
                    seatsByDate.getOrDefault(date, 0L)));
            points.add(point);
        }
        return points;
    }

    public Page<MoviePerformanceDTO> getMoviePerformance(DateRangeDTO range, Pageable pageable) {
        validateDateRange(range);

        LocalDateTime from = range.getFrom().atStartOfDay();
        LocalDateTime to = range.getTo().atTime(LocalTime.MAX);

        Page<MovieRevenueProjection> revenuePage = tmdbMovieRepository.findMoviePerformanceBetween(ShowtimeStatus.REPORTABLE_STATUSES, from, to, pageable);
        if (revenuePage.isEmpty()) {
            return revenuePage.map(revenue -> toMoviePerformance(revenue, 0, 0));
        }

        List<Long> movieIds = revenuePage.getContent().stream().map(MovieRevenueProjection::movieId).toList();
        Map<Long, Long> ticketsByMovie = bookingRepository.countMovieTicketsSoldBetween(ShowtimeStatus.REPORTABLE_STATUSES, movieIds, from, to)
                .stream()
                .collect(Collectors.toMap(MovieTicketsSoldProjection::movieId, MovieTicketsSoldProjection::ticketsSold));
        Map<Long, Long> seatsByMovie = hallRepository.findMovieShowtimeHallsBetween(ShowtimeStatus.REPORTABLE_STATUSES, movieIds, from, to)
                .stream()
                .collect(Collectors.groupingBy(MovieHallProjection::movieId,
                        Collectors.summingLong(projection -> projection.hall().getCapacity())));

        return revenuePage.map(revenue -> toMoviePerformance(
                revenue,
                ticketsByMovie.getOrDefault(revenue.movieId(), 0L),
                seatsByMovie.getOrDefault(revenue.movieId(), 0L)));
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

    private MoviePerformanceDTO toMoviePerformance(MovieRevenueProjection revenue, long ticketsSold, long totalSeats) {
        MoviePerformanceDTO dto = new MoviePerformanceDTO();
        dto.setMovieTitle(revenue.movieTitle());
        dto.setNetRevenue(revenue.netRevenue());
        dto.setRefunded(revenue.refunded());
        dto.setTotalShowtimes(revenue.totalShowtimes());
        dto.setTicketsSold(ticketsSold);
        dto.setTotalSeats(totalSeats);
        return dto;
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
