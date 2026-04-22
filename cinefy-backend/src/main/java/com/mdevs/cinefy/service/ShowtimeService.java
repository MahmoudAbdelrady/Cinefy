package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.movie.MovieDetailDTO;
import com.mdevs.cinefy.dto.showtime.MovieShowtimeDatesDTO;
import com.mdevs.cinefy.dto.showtime.MovieShowtimeRowDTO;
import com.mdevs.cinefy.dto.showtime.MovieShowtimesDTO;
import com.mdevs.cinefy.dto.showtime.MovieWithShowtimesDTO;
import com.mdevs.cinefy.dto.showtime.ShowtimeDTO;
import com.mdevs.cinefy.dto.showtime.ShowtimeSummaryDTO;
import com.mdevs.cinefy.dto.showtime.ShowtimesStatisticsDTO;
import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.HallStatus;
import com.mdevs.cinefy.entity.Showtime;
import com.mdevs.cinefy.entity.ShowtimeStatus;
import com.mdevs.cinefy.entity.TmdbMovie;
import com.mdevs.cinefy.dto.showtime.MovieShowtimeCountProjection;
import com.mdevs.cinefy.dto.showtime.PublishShowtimesDTO;
import com.mdevs.cinefy.repository.ShowtimeRepository;
import com.mdevs.cinefy.repository.TmdbMovieRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShowtimeService {

    private final ShowtimeRepository showtimeRepository;

    private final TmdbMovieRepository tmdbMovieRepository;

    private final HallService hallService;

    private final TmdbMovieService tmdbMovieService;

    private static final int CLEANUP_BUFFER_MINUTES = 15;

    private static final Set<ShowtimeStatus> ACTIVE_STATUSES = Set.of(ShowtimeStatus.DRAFT, ShowtimeStatus.PUBLISHED);

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    // ========================= Public API =========================

    public MovieShowtimeDatesDTO getMovieShowtimeDates(Long movieId) {
        List<LocalDate> dates = showtimeRepository.findDistinctShowtimeDatesByMovieAndStatuses(movieId, ACTIVE_STATUSES);
        if (dates.isEmpty()) {
            throw new NotFoundException("No showtimes found for movie with id: " + movieId);
        }

        long numberOfDrafts = showtimeRepository.countByTmdbMovieIdAndStatus(movieId, ShowtimeStatus.DRAFT);

        MovieShowtimeDatesDTO dto = new MovieShowtimeDatesDTO();
        dto.setNumberOfDrafts(numberOfDrafts);
        dto.setDates(dates.stream().map(LocalDate::toString).toList());
        return dto;
    }

    public MovieShowtimesDTO getMovieShowtimesForDate(Long movieId, LocalDate date) {
        List<Showtime> showtimes = showtimeRepository.findByMovieStatusesAndDateRangeWithHall(movieId, ACTIVE_STATUSES, date.atStartOfDay(), date.plusDays(1).atStartOfDay());
        if (showtimes.isEmpty()) {
            throw new NotFoundException("No showtimes found for movie with id: " + movieId + " on " + date);
        }

        long numberOfDrafts = showtimes.stream().filter(s -> s.getStatus().equals(ShowtimeStatus.DRAFT)).count();

        MovieShowtimesDTO dto = new MovieShowtimesDTO();
        dto.setNumberOfDrafts(numberOfDrafts);
        dto.setShowtimes(showtimes.stream().map(this::toMovieShowtimeRow).toList());
        return dto;
    }

    public ShowtimesStatisticsDTO getShowtimesStatistics() {
        long totalMovies = showtimeRepository.countDistinctMoviesByStatusIn(ACTIVE_STATUSES);
        long totalShowtimes = showtimeRepository.countByStatusIn(ACTIVE_STATUSES);
        LocalDate today = LocalDate.now();
        long todayShowtimes = showtimeRepository.countByStatusInAndStartDateTimeGreaterThanEqualAndStartDateTimeLessThan(
                ACTIVE_STATUSES, today.atStartOfDay(), today.plusDays(1).atStartOfDay());

        ShowtimesStatisticsDTO dto = new ShowtimesStatisticsDTO();
        dto.setTotalMovies(totalMovies);
        dto.setTotalShowtimes(totalShowtimes);
        dto.setTodayShowtimes(todayShowtimes);
        return dto;
    }

    public List<MovieWithShowtimesDTO> getMoviesWithShowtimes() {
        List<MovieShowtimeCountProjection> counts = showtimeRepository.findMovieShowtimeCounts(ACTIVE_STATUSES);
        if (counts.isEmpty()) {
            return List.of();
        }

        List<Long> movieIds = counts.stream().map(MovieShowtimeCountProjection::getMovieId).toList();
        Map<Long, TmdbMovie> moviesById = tmdbMovieRepository.findAllById(movieIds).stream()
                .collect(Collectors.toMap(TmdbMovie::getId, Function.identity()));

        return counts.stream()
                .map(c -> toMovieWithShowtimes(c, moviesById.get(c.getMovieId())))
                .filter(Objects::nonNull)
                .sorted(Comparator
                        .comparingLong(MovieWithShowtimesDTO::getTotalShowtimes).reversed()
                        .thenComparing(dto -> dto.getMovieDetails().getTitle(), Comparator.nullsLast(String::compareTo)))
                .toList();
    }

    @Transactional
    public ShowtimeSummaryDTO createShowtime(ShowtimeDTO dto) {
        Hall hall = hallService.findHall(dto.getHallId());
        TmdbMovie movie = dto.getMovieId() != null ? tmdbMovieService.fetchAndCache(dto.getMovieId()) : null;
        validateShowtime(hall, movie, dto, null);

        Showtime showtime = applyDtoToShowtime(new Showtime(), hall, movie, dto);
        showtimeRepository.save(showtime);

        hallService.updateHallStatus(hall, HallStatus.SCHEDULED);

        return toSummaryDTO(showtime);
    }

    @Transactional
    public ShowtimeSummaryDTO updateShowtime(String uuid, ShowtimeDTO dto) {
        Showtime showtime = findShowtime(uuid);
        if (!showtime.getStatus().equals(ShowtimeStatus.DRAFT) && !showtime.getStatus().equals(ShowtimeStatus.PUBLISHED)) {
            throw new BusinessException("Only draft or published showtimes can be updated");
        }

        Hall previousHall = showtime.getHall();
        Hall hall = hallService.findHall(dto.getHallId());
        TmdbMovie movie = dto.getMovieId() != null ? tmdbMovieService.fetchAndCache(dto.getMovieId()) : showtime.getTmdbMovie();
        validateShowtime(hall, movie, dto, showtime.getId());

        applyDtoToShowtime(showtime, hall, movie, dto);
        showtimeRepository.save(showtime);

        if (!previousHall.getId().equals(hall.getId())) {
            flipHallIfNoActiveShowtimes(previousHall, showtime.getId());
            hallService.updateHallStatus(hall, HallStatus.SCHEDULED);
        }

        return toSummaryDTO(showtime);
    }

    @Transactional
    public void deleteShowtime(String uuid) {
        Showtime showtime = findShowtime(uuid);
        // @TODO --> This could be changed to depend on the number of reserved seats instead
        if (showtime.getStatus().equals(ShowtimeStatus.PUBLISHED)) {
            throw new BusinessException("Cannot delete a published showtime");
        }
        Hall hall = showtime.getHall();
        showtimeRepository.delete(showtime);
        flipHallIfNoActiveShowtimes(hall, showtime.getId());
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
        return showtimeRepository.findByUuid(uuid).orElseThrow(() -> new NotFoundException("Showtime not found: " + uuid));
    }

    private void validateShowtime(Hall hall, TmdbMovie movie, ShowtimeDTO dto, Long showtimeId) {
        if (showtimeId == null && dto.getMovieId() == null) {
            throw new BusinessException("Movie is required");
        }

        if (!hall.getStatus().equals(HallStatus.ACTIVE) && !hall.getStatus().equals(HallStatus.SCHEDULED)) {
            throw new BusinessException("Hall '" + hall.getName() + "' is not available");
        }

        if (dto.getDateTime().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Showtime cannot be scheduled in the past");
        }

        if (dto.is3D() && !hall.isSupports3D()) {
            throw new BusinessException("Hall '" + hall.getName() + "' does not support 3D screenings");
        }

        if (movie.getDurationMinutes() == null || movie.getDurationMinutes() <= 0) {
            throw new BusinessException("Movie '" + movie.getTitle() + "' does not have a runtime yet and cannot be scheduled");
        }

        // Pad the new showtime's end with a cleanup buffer, so back-to-back showtimes leave time to reset the hall
        LocalDateTime end = dto.getDateTime().plusMinutes(movie.getDurationMinutes()).plusMinutes(CLEANUP_BUFFER_MINUTES);
        boolean overlaps = showtimeRepository.existsOverlapping(hall, dto.getDateTime(), end, showtimeId);
        if (overlaps) {
            throw new BusinessException("Another showtime is already scheduled in this hall at the selected time");
        }
    }

    private void flipHallIfNoActiveShowtimes(Hall hall, Long excludeId) {
        boolean stillHasShowtimes = showtimeRepository.existsByHallAndStatusInAndIdNot(hall, Set.of(ShowtimeStatus.DRAFT, ShowtimeStatus.PUBLISHED), excludeId);
        if (!stillHasShowtimes) {
            hallService.updateHallStatus(hall, HallStatus.ACTIVE);
        }
    }

    private void publishOneShowtime(String uuid) {
        Showtime showtime = findShowtime(uuid);
        if (!showtime.getStatus().equals(ShowtimeStatus.DRAFT)) {
            throw new BusinessException("Only draft showtimes can be published; showtime with id: '" + uuid + "' is " + showtime.getStatus());
        }
        showtime.setStatus(ShowtimeStatus.PUBLISHED);
        showtimeRepository.save(showtime);
    }

    private void publishDraftsForMovie(Long movieId, LocalDate date) {
        LocalDateTime startDateTime = date != null ? date.atStartOfDay() : null;
        LocalDateTime endDateTime = date != null ? date.plusDays(1).atStartOfDay() : null;
        List<Showtime> drafts = showtimeRepository.findByTmdbMovieAndStatusAndStartDateTimeInRange(movieId, ShowtimeStatus.DRAFT, startDateTime, endDateTime);
        if (drafts.isEmpty()) {
            throw new NotFoundException("No draft showtimes found for movie with id: " + movieId + (date != null ? " on " + date : ""));
        }
        for (Showtime showtime : drafts) {
            showtime.setStatus(ShowtimeStatus.PUBLISHED);
            showtimeRepository.save(showtime);
        }
    }

    private Showtime applyDtoToShowtime(Showtime showtime, Hall hall, TmdbMovie movie, ShowtimeDTO dto) {
        showtime.setTmdbMovie(movie);
        showtime.setHall(hall);
        showtime.setStartDateTime(dto.getDateTime());
        showtime.setEndDateTime(dto.getDateTime().plusMinutes(movie.getDurationMinutes()));
        showtime.set3D(dto.is3D());
        showtime.setSpecialNotes(dto.getSpecialNotes());
        return showtime;
    }

    private MovieShowtimeRowDTO toMovieShowtimeRow(Showtime showtime) {
        Hall hall = showtime.getHall();
        MovieShowtimeRowDTO dto = new MovieShowtimeRowDTO();
        dto.setTime(showtime.getStartDateTime().toLocalTime().format(TIME_FORMATTER));
        dto.setHallName(hall.getName());
        dto.setStatus(showtime.getStatus().name());
        dto.setReservedSeats(0);
        dto.setTotalSeats(hall.getTotalRows() * hall.getTotalColumns());
        return dto;
    }

    private MovieWithShowtimesDTO toMovieWithShowtimes(MovieShowtimeCountProjection counts, TmdbMovie movie) {
        if (movie == null) return null;
        MovieDetailDTO details = tmdbMovieService.toMovieDetail(movie);
        details.setSynopsis(null);

        MovieWithShowtimesDTO dto = new MovieWithShowtimesDTO();
        dto.setTotalShowtimes(counts.getTotalShowtimes());
        dto.setTotalDraftShowtimes(counts.getTotalDraftShowtimes());
        dto.setMovieDetails(details);
        return dto;
    }

    private ShowtimeSummaryDTO toSummaryDTO(Showtime showtime) {
        ShowtimeSummaryDTO dto = new ShowtimeSummaryDTO();
        dto.setId(showtime.getUuid());
        dto.setMovie(tmdbMovieService.toMovieDetail(showtime.getTmdbMovie()));
        dto.setHallId(showtime.getHall().getUuid());
        dto.setHallName(showtime.getHall().getName());
        dto.setStartDateTime(showtime.getStartDateTime());
        dto.setStatus(showtime.getStatus().name());
        return dto;
    }
}
