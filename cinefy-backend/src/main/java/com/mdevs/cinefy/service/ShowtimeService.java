package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.hall.HallReferenceDTO;
import com.mdevs.cinefy.dto.showtime.MovieShowtimeDatesDTO;
import com.mdevs.cinefy.dto.showtime.MovieShowtimeListItemDTO;
import com.mdevs.cinefy.dto.showtime.MovieShowtimesDTO;
import com.mdevs.cinefy.dto.showtime.MovieWithShowtimesDTO;
import com.mdevs.cinefy.dto.showtime.ScheduledShowtimeDTO;
import com.mdevs.cinefy.projection.showtime.ShowtimeBookedSeatsProjection;
import com.mdevs.cinefy.dto.showtime.ShowtimeDTO;
import com.mdevs.cinefy.dto.showtime.ShowtimeSummaryDTO;
import com.mdevs.cinefy.dto.showtime.ShowtimesStatisticsDTO;
import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.enums.HallStatus;
import com.mdevs.cinefy.entity.Showtime;
import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
import com.mdevs.cinefy.entity.enums.StaffPosition;
import com.mdevs.cinefy.entity.StaffMember;
import com.mdevs.cinefy.entity.TmdbMovie;
import com.mdevs.cinefy.entity.User;
import com.mdevs.cinefy.projection.showtime.MovieShowtimeCountProjection;
import com.mdevs.cinefy.dto.showtime.PublishShowtimesDTO;
import com.mdevs.cinefy.projection.showtime.ShowtimeBookingCountsProjection;
import com.mdevs.cinefy.repository.BookingRepository;
import com.mdevs.cinefy.repository.ShowtimeRepository;
import com.mdevs.cinefy.repository.TmdbMovieRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import com.mdevs.cinefy.utils.DateUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShowtimeService {

    private final ShowtimeRepository showtimeRepository;

    private final BookingRepository bookingRepository;

    private final TmdbMovieRepository tmdbMovieRepository;

    private final HallService hallService;

    private final TmdbMovieService tmdbMovieService;

    private final CurrentUserService currentUserService;

    private final DateUtil dateUtil;

    private static final Set<StaffPosition> MANAGEMENT_POSITIONS = Set.of(StaffPosition.ADMIN, StaffPosition.MANAGER);

    // ========================= Public API =========================

    public MovieShowtimeDatesDTO getMovieShowtimeDates(Long movieId) {
        boolean canManage = canManageShowtimes(currentUserService.loadCurrentUser());
        Set<ShowtimeStatus> statuses = canManage ? ShowtimeStatus.LIVE_STATUSES : ShowtimeStatus.COMMITTED_STATUSES;
        List<String> dates = showtimeRepository.findStartDateTimesByMovieAndStatuses(movieId, statuses)
                .stream()
                .map(startDateTime -> dateUtil.toCinemaDate(startDateTime).toString())
                .distinct()
                .toList();

        MovieShowtimeDatesDTO dto = new MovieShowtimeDatesDTO();
        if (dates.isEmpty()) {
            if (canManage) {
                dto.setNumberOfDrafts(0L);
                dto.setNumberOfCommitted(0L);
            }
            dto.setDates(List.of());
            return dto;
        }

        if (canManage) {
            dto.setNumberOfDrafts(showtimeRepository.countByTmdbMovieIdAndStatusIn(movieId, Set.of(ShowtimeStatus.DRAFT)));
            dto.setNumberOfCommitted(showtimeRepository.countByTmdbMovieIdAndStatusIn(movieId, ShowtimeStatus.COMMITTED_STATUSES));
        }
        dto.setDates(dates);
        return dto;
    }

    public MovieShowtimesDTO getMovieShowtimesForDate(Long movieId, LocalDate date) {
        User currentUser = currentUserService.loadCurrentUser();
        boolean canManage = canManageShowtimes(currentUser);
        Set<ShowtimeStatus> statuses = canManage ? ShowtimeStatus.LIVE_STATUSES : ShowtimeStatus.COMMITTED_STATUSES;
        List<Showtime> showtimes = showtimeRepository.findByMovieStatusesAndDateRangeWithHall(movieId, statuses,
                dateUtil.startOfDay(date), dateUtil.startOfDay(date.plusDays(1)));

        MovieShowtimesDTO dto = new MovieShowtimesDTO();
        if (showtimes.isEmpty()) {
            if (canManage) {
                dto.setNumberOfDrafts(0L);
            }
            dto.setShowtimes(List.of());
            return dto;
        }

        List<Long> showtimeIds = showtimes.stream().map(Showtime::getId).toList();
        Map<Long, ShowtimeBookingCountsProjection> countsByShowtime = bookingRepository.countBookedAndHeldByShowtime(showtimeIds, Instant.now(), currentUser.getId())
                .stream()
                .collect(Collectors.toMap(ShowtimeBookingCountsProjection::getShowtimeId, Function.identity()));

        if (canManage) {
            dto.setNumberOfDrafts(showtimes.stream().filter(s -> s.getStatus().equals(ShowtimeStatus.DRAFT)).count());
        }
        dto.setShowtimes(showtimes.stream()
                .map(showtime -> toMovieShowtimeListItem(showtime, countsByShowtime.get(showtime.getId())))
                .toList());
        return dto;
    }

    public List<ScheduledShowtimeDTO> getScheduleForDate(LocalDate day) {
        List<Showtime> showtimes = showtimeRepository.findByMovieStatusesAndDateRangeWithHall(
                null, ShowtimeStatus.COMMITTED_STATUSES, dateUtil.startOfDay(day), dateUtil.startOfDay(day.plusDays(1)));

        if (showtimes.isEmpty()) {
            return List.of();
        }

        List<Long> showtimeIds = showtimes.stream().map(Showtime::getId).toList();
        Map<Long, ShowtimeBookedSeatsProjection> countsByShowtime = bookingRepository.countBookedSeatsByShowtime(showtimeIds, Instant.now(), null, null)
                .stream()
                .collect(Collectors.toMap(ShowtimeBookedSeatsProjection::getShowtimeId, Function.identity()));

        return showtimes.stream()
                .map(showtime -> toScheduledShowtime(showtime, countsByShowtime.get(showtime.getId())))
                .toList();
    }

    public ShowtimesStatisticsDTO getShowtimesStatistics() {
        long totalMovies = showtimeRepository.countDistinctMoviesByStatusIn(ShowtimeStatus.LIVE_STATUSES);
        long totalShowtimes = showtimeRepository.countByStatusIn(ShowtimeStatus.LIVE_STATUSES);
        LocalDate today = dateUtil.today();
        long todayShowtimes = showtimeRepository.countByStatusInAndStartDateTimeGreaterThanEqualAndStartDateTimeLessThan(
                ShowtimeStatus.LIVE_STATUSES, dateUtil.startOfDay(today), dateUtil.startOfDay(today.plusDays(1)));

        ShowtimesStatisticsDTO dto = new ShowtimesStatisticsDTO();
        dto.setTotalMovies(totalMovies);
        dto.setTotalShowtimes(totalShowtimes);
        dto.setTodayShowtimes(todayShowtimes);
        return dto;
    }

    public List<MovieWithShowtimesDTO> getMoviesWithShowtimes() {
        List<MovieShowtimeCountProjection> counts = showtimeRepository.findMovieShowtimeCounts(ShowtimeStatus.LIVE_STATUSES);
        if (counts.isEmpty()) {
            return List.of();
        }

        List<Long> movieIds = counts.stream().map(MovieShowtimeCountProjection::getMovieId).toList();
        Map<Long, TmdbMovie> moviesById = tmdbMovieRepository.findAllById(movieIds).stream()
                .collect(Collectors.toMap(TmdbMovie::getId, Function.identity()));

        return counts.stream()
                .map(c -> toMovieWithShowtimes(c, moviesById.get(c.getMovieId())))
                .sorted(Comparator
                        .comparingLong(MovieWithShowtimesDTO::getTotalShowtimes).reversed()
                        .thenComparing(dto -> dto.getMovieDetails().getReleaseDate(), Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Transactional
    public ShowtimeSummaryDTO createShowtime(ShowtimeDTO dto) {
        Hall hall = hallService.findHallWithType(dto.getHallId());
        TmdbMovie movie = dto.getMovieId() != null ? tmdbMovieService.fetchAndCache(dto.getMovieId()) : null;
        validateShowtime(hall, movie, dto, null);

        Showtime showtime = applyDtoToShowtime(new Showtime(), hall, movie, dto);
        showtimeRepository.save(showtime);

        hallService.updateHallStatus(hall, HallStatus.SCHEDULED);

        return toSummaryDTO(showtime, null);
    }

    @Transactional
    public ShowtimeSummaryDTO updateShowtime(String uuid, ShowtimeDTO dto) {
        Showtime showtime = findShowtime(uuid);
        validateShowtimesMutable(List.of(showtime), "update");

        Hall previousHall = showtime.getHall();
        Hall hall = hallService.findHallWithType(dto.getHallId());
        TmdbMovie movie = dto.getMovieId() != null ? tmdbMovieService.fetchAndCache(dto.getMovieId()) : showtime.getTmdbMovie();
        validateShowtime(hall, movie, dto, showtime.getId());

        applyDtoToShowtime(showtime, hall, movie, dto);
        showtimeRepository.save(showtime);

        if (!previousHall.getId().equals(hall.getId())) {
            flipHallIfNoActiveShowtimes(previousHall, showtime.getId());
            hallService.updateHallStatus(hall, HallStatus.SCHEDULED);
        }

        User currentUser = currentUserService.loadCurrentUser();
        Long staffId = currentUser instanceof StaffMember staff ? staff.getId() : null;
        ShowtimeBookingCountsProjection counts = bookingRepository.countBookedAndHeldByShowtime(List.of(showtime.getId()), Instant.now(), staffId)
                .stream()
                .findFirst()
                .orElse(null);

        return toSummaryDTO(showtime, counts);
    }

    @Transactional
    public void deleteShowtime(String uuid) {
        Showtime showtime = findShowtime(uuid);
        validateShowtimesMutable(List.of(showtime), "delete");
        Hall hall = showtime.getHall();
        showtimeRepository.delete(showtime);
        flipHallIfNoActiveShowtimes(hall, showtime.getId());
        tmdbMovieService.clearHighlightIfIneligible(showtime.getTmdbMovie());
    }

    @Transactional
    public void deleteMovieShowtimes(Long movieId) {
        List<Showtime> showtimes = showtimeRepository.findByTmdbMovieIdAndStatusIn(movieId, ShowtimeStatus.LIVE_STATUSES);

        if (showtimes.isEmpty()) {
            throw new NotFoundException("No showtimes found for the provided movie");
        }

        validateShowtimesMutable(showtimes, "delete");

        Set<Hall> affectedHalls = showtimes.stream().map(Showtime::getHall).collect(Collectors.toCollection(LinkedHashSet::new));

        showtimeRepository.deleteAll(showtimes);

        affectedHalls.forEach(hall -> flipHallIfNoActiveShowtimes(hall, null));
        tmdbMovieService.clearHighlightIfIneligible(tmdbMovieService.findTmdbMovie(movieId));
    }

    @Transactional
    public void publishShowtimes(PublishShowtimesDTO dto) {
        if (dto.getShowtimeId() != null) {
            publishOneShowtime(dto.getShowtimeId());
            return;
        }
        if (dto.getMovieId() == null) {
            throw new BusinessException("Either showtimeId or movieId is required");
        }
        publishDraftsForMovie(dto.getMovieId(), dto.getDate());
    }

    // =========================== Helpers ===========================

    private Showtime findShowtime(String uuid) {
        return showtimeRepository.findByUuid(uuid).orElseThrow(() -> new NotFoundException("Showtime not found"));
    }

    private void validateShowtime(Hall hall, TmdbMovie movie, ShowtimeDTO dto, Long showtimeId) {
        if (showtimeId == null && dto.getMovieId() == null) {
            throw new BusinessException("Movie is required");
        }

        if (!List.of(HallStatus.ACTIVE, HallStatus.SCHEDULED).contains(hall.getStatus())) {
            throw new BusinessException("Hall '" + hall.getName() + "' is not available");
        }

        Instant start = dateUtil.toInstant(dto.getDateTime());
        if (start.isBefore(Instant.now())) {
            throw new BusinessException("Showtime cannot be scheduled in the past");
        }

        if (dto.is3D() && !hall.isSupports3D()) {
            throw new BusinessException("Hall '" + hall.getName() + "' does not support 3D screenings");
        }

        if (movie.getDurationMinutes() == null || movie.getDurationMinutes() <= 0) {
            throw new BusinessException("Movie '" + movie.getTitle() + "' does not have a runtime yet and cannot be scheduled");
        }

        Instant end = start.plus(movie.getDurationMinutes(), ChronoUnit.MINUTES);
        boolean overlaps = showtimeRepository.existsOverlapping(hall, start, end, showtimeId);
        if (overlaps) {
            throw new BusinessException("Another showtime is already scheduled in this hall at the selected time");
        }
    }

    private void validateShowtimeNotInPast(Showtime showtime) {
        if (showtime.getStartDateTime().isBefore(Instant.now())) {
            throw new BusinessException("Cannot publish a showtime scheduled in the past");
        }
    }

    private void validateShowtimesMutable(List<Showtime> showtimes, String action) {
        boolean single = showtimes.size() == 1;
        List<Long> publishedIds = new ArrayList<>();
        for (Showtime showtime : showtimes) {
            if (showtime.getStatus().equals(ShowtimeStatus.DRAFT)) {
                continue;
            }
            if (!ShowtimeStatus.ACTIVE_STATUSES.contains(showtime.getStatus())) {
                throw new BusinessException(single
                        ? "Cannot " + action + " a showtime that's not draft or published"
                        : "Cannot " + action + " showtimes that aren't draft or published");
            }
            publishedIds.add(showtime.getId());
        }
        if (!publishedIds.isEmpty() && bookingRepository.existsBookedSeatByShowtimeIn(publishedIds, Instant.now())) {
            throw new BusinessException(single
                    ? "Cannot " + action + " a published showtime that already has bookings"
                    : "Cannot " + action + " published showtimes that already have bookings");
        }
    }

    private void flipHallIfNoActiveShowtimes(Hall hall, Long excludeId) {
        boolean stillHasShowtimes = showtimeRepository.existsByHallAndStatusInAndIdNot(hall, ShowtimeStatus.LIVE_STATUSES, excludeId);
        if (!stillHasShowtimes) {
            hallService.updateHallStatus(hall, HallStatus.ACTIVE);
        }
    }

    private void publishOneShowtime(String uuid) {
        Showtime showtime = findShowtime(uuid);
        if (!showtime.getStatus().equals(ShowtimeStatus.DRAFT)) {
            throw new BusinessException("Cannot publish a showtime that's not draft");
        }
        validateShowtimeNotInPast(showtime);
        showtime.setStatus(ShowtimeStatus.PUBLISHED);
        showtimeRepository.save(showtime);
        tmdbMovieService.clearAnnouncement(showtime.getTmdbMovie());
    }

    private void publishDraftsForMovie(Long movieId, LocalDate date) {
        Instant startDateTime = date != null ? dateUtil.startOfDay(date) : null;
        Instant endDateTime = date != null ? dateUtil.startOfDay(date.plusDays(1)) : null;
        List<Showtime> drafts = showtimeRepository.findByTmdbMovieAndStatusAndStartDateTimeInRange(movieId, ShowtimeStatus.DRAFT, startDateTime, endDateTime);
        if (drafts.isEmpty()) {
            throw new NotFoundException("No draft showtimes found for the provided movie" + (date != null ? " on " + date : ""));
        }
        drafts.forEach(this::validateShowtimeNotInPast);
        for (Showtime showtime : drafts) {
            showtime.setStatus(ShowtimeStatus.PUBLISHED);
            showtimeRepository.save(showtime);
        }
        tmdbMovieService.clearAnnouncement(tmdbMovieService.findTmdbMovie(movieId));
    }

    private Showtime applyDtoToShowtime(Showtime showtime, Hall hall, TmdbMovie movie, ShowtimeDTO dto) {
        showtime.setTmdbMovie(movie);
        showtime.setHall(hall);
        Instant start = dateUtil.toInstant(dto.getDateTime());
        showtime.setStartDateTime(start);
        showtime.setEndDateTime(start.plus(movie.getDurationMinutes(), ChronoUnit.MINUTES));
        showtime.set3D(dto.is3D());
        showtime.setSpecialNotes(dto.getSpecialNotes());
        return showtime;
    }

    private MovieShowtimeListItemDTO toMovieShowtimeListItem(Showtime showtime, ShowtimeBookingCountsProjection counts) {
        Hall hall = showtime.getHall();
        MovieShowtimeListItemDTO dto = new MovieShowtimeListItemDTO();
        dto.setId(showtime.getUuid());
        dto.setTime(dateUtil.formatTime(showtime.getStartDateTime()));
        dto.setHall(toHallReference(hall));
        dto.setStatus(showtime.getStatus().name());
        dto.setSpecialNotes(showtime.getSpecialNotes());
        dto.set3D(showtime.is3D());
        dto.setBookedSeats(counts != null ? counts.getBookedSeats() : 0);
        dto.setMyOnHoldSeats(counts != null ? counts.getMyOnHoldSeats() : 0);
        dto.setTotalSeats(hall.getCapacity());
        dto.setBookable(BookingService.isBookable(showtime));
        return dto;
    }

    private ScheduledShowtimeDTO toScheduledShowtime(Showtime showtime, ShowtimeBookedSeatsProjection counts) {
        ScheduledShowtimeDTO dto = new ScheduledShowtimeDTO();
        dto.setId(showtime.getUuid());
        dto.setMovie(tmdbMovieService.toSearchResult(showtime.getTmdbMovie()));
        dto.setStartsAt(dateUtil.formatTime(showtime.getStartDateTime()));
        dto.setEndsAt(dateUtil.formatTime(showtime.getEndDateTime()));
        dto.setTicketsSold(counts != null ? counts.getBookedSeats() : 0);
        dto.setTotalSeats(showtime.getHall().getCapacity());
        return dto;
    }

    private MovieWithShowtimesDTO toMovieWithShowtimes(MovieShowtimeCountProjection counts, TmdbMovie movie) {
        MovieWithShowtimesDTO dto = new MovieWithShowtimesDTO();
        dto.setTotalShowtimes(counts.getTotalShowtimes());
        dto.setTotalDraftShowtimes(counts.getTotalDraftShowtimes());
        dto.setMovieDetails(tmdbMovieService.toMovieSummary(movie));
        return dto;
    }

    private ShowtimeSummaryDTO toSummaryDTO(Showtime showtime, ShowtimeBookingCountsProjection counts) {
        Hall hall = showtime.getHall();
        ShowtimeSummaryDTO dto = new ShowtimeSummaryDTO();
        dto.setId(showtime.getUuid());
        dto.setMovie(tmdbMovieService.toMovieSummary(showtime.getTmdbMovie()));
        dto.setHall(toHallReference(hall));
        dto.setStartDateTime(dateUtil.toCinemaDateTime(showtime.getStartDateTime()));
        dto.setStatus(showtime.getStatus().name());
        dto.setSpecialNotes(showtime.getSpecialNotes());
        dto.set3D(showtime.is3D());
        dto.setBookedSeats(counts != null ? counts.getBookedSeats() : 0);
        dto.setMyOnHoldSeats(counts != null ? counts.getMyOnHoldSeats() : 0);
        dto.setTotalSeats(hall.getCapacity());
        dto.setBookable(BookingService.isBookable(showtime));
        return dto;
    }

    private HallReferenceDTO toHallReference(Hall hall) {
        HallReferenceDTO dto = new HallReferenceDTO();
        dto.setId(hall.getUuid());
        dto.setName(hall.getName());
        dto.setTypeName(hall.getType().getName());
        return dto;
    }

    private boolean canManageShowtimes(User user) {
        return user instanceof StaffMember staff && MANAGEMENT_POSITIONS.contains(staff.getPosition());
    }
}
