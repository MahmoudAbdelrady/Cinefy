package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.hall.HallReferenceDTO;
import com.mdevs.cinefy.dto.showtime.MovieShowtimeDatesDTO;
import com.mdevs.cinefy.dto.showtime.MovieShowtimeListItemDTO;
import com.mdevs.cinefy.dto.showtime.MovieShowtimesDTO;
import com.mdevs.cinefy.dto.showtime.MovieWithShowtimesDTO;
import com.mdevs.cinefy.dto.showtime.ShowtimeDTO;
import com.mdevs.cinefy.dto.showtime.ShowtimeSummaryDTO;
import com.mdevs.cinefy.dto.showtime.ShowtimesStatisticsDTO;
import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.enums.HallStatus;
import com.mdevs.cinefy.entity.Showtime;
import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
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

    private final TmdbMovieRepository tmdbMovieRepository;

    private final HallService hallService;

    private final TmdbMovieService tmdbMovieService;

    private static final int CLEANUP_BUFFER_MINUTES = 15;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    // ========================= Public API =========================

    public MovieShowtimeDatesDTO getMovieShowtimeDates(Long movieId) {
        List<LocalDate> dates = showtimeRepository.findDistinctShowtimeDatesByMovieAndStatuses(movieId, ShowtimeStatus.LIVE_STATUSES);
        if (dates.isEmpty()) {
            throw new NotFoundException("No showtimes found for the provided movie");
        }

        long numberOfDrafts = showtimeRepository.countByTmdbMovieIdAndStatusIn(movieId, Set.of(ShowtimeStatus.DRAFT));
        long numberOfCommitted = showtimeRepository.countByTmdbMovieIdAndStatusIn(movieId, ShowtimeStatus.COMMITTED_STATUSES);

        MovieShowtimeDatesDTO dto = new MovieShowtimeDatesDTO();
        dto.setNumberOfDrafts(numberOfDrafts);
        dto.setNumberOfCommitted(numberOfCommitted);
        dto.setDates(dates.stream().map(LocalDate::toString).toList());
        return dto;
    }

    public MovieShowtimesDTO getMovieShowtimesForDate(Long movieId, LocalDate date) {
        List<Showtime> showtimes = showtimeRepository.findByMovieStatusesAndDateRangeWithHall(movieId, ShowtimeStatus.LIVE_STATUSES, date.atStartOfDay(), date.plusDays(1).atStartOfDay());
        if (showtimes.isEmpty()) {
            throw new NotFoundException("No showtimes found for the provided movie on " + date);
        }

        long numberOfDrafts = showtimes.stream().filter(s -> s.getStatus().equals(ShowtimeStatus.DRAFT)).count();

        MovieShowtimesDTO dto = new MovieShowtimesDTO();
        dto.setNumberOfDrafts(numberOfDrafts);
        dto.setShowtimes(showtimes.stream().map(this::toMovieShowtimeListItem).toList());
        return dto;
    }

    public ShowtimesStatisticsDTO getShowtimesStatistics() {
        long totalMovies = showtimeRepository.countDistinctMoviesByStatusIn(ShowtimeStatus.LIVE_STATUSES);
        long totalShowtimes = showtimeRepository.countByStatusIn(ShowtimeStatus.LIVE_STATUSES);
        LocalDate today = LocalDate.now();
        long todayShowtimes = showtimeRepository.countByStatusInAndStartDateTimeGreaterThanEqualAndStartDateTimeLessThan(
                ShowtimeStatus.LIVE_STATUSES, today.atStartOfDay(), today.plusDays(1).atStartOfDay());

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
        // @TODO --> This should be changed to depend on the number of reserved seats instead for the published status
        if (!ShowtimeStatus.ACTIVE_STATUSES.contains(showtime.getStatus())) {
            throw new BusinessException("Cannot update a showtime that's not draft or published");
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
        // @TODO --> This should be changed to depend on the number of reserved seats instead of the published status
        if (!ShowtimeStatus.ACTIVE_STATUSES.contains(showtime.getStatus())) {
            throw new BusinessException("Cannot delete a showtime that's not draft or published");
        }
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

        // @TODO --> This should be changed to depend on the number of reserved seats instead of the published status
        if (showtimes.stream().anyMatch(s -> !ShowtimeStatus.ACTIVE_STATUSES.contains(s.getStatus()))) {
            throw new BusinessException("Cannot delete a showtime that's not draft or published");
        }

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
        return showtimeRepository.findByUuid(uuid).orElseThrow(() -> new NotFoundException("Showtime not found: " + uuid));
    }

    private void validateShowtime(Hall hall, TmdbMovie movie, ShowtimeDTO dto, Long showtimeId) {
        if (showtimeId == null && dto.getMovieId() == null) {
            throw new BusinessException("Movie is required");
        }

        if (!List.of(HallStatus.ACTIVE, HallStatus.SCHEDULED, HallStatus.NOW_SHOWING).contains(hall.getStatus())) {
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

        LocalDateTime end = dto.getDateTime().plusMinutes(movie.getDurationMinutes()).plusMinutes(CLEANUP_BUFFER_MINUTES);
        boolean overlaps = showtimeRepository.existsOverlapping(hall, dto.getDateTime(), end, showtimeId);
        if (overlaps) {
            throw new BusinessException("Another showtime is already scheduled in this hall at the selected time");
        }
    }

    private void validateShowtimeNotInPast(Showtime showtime) {
        if (showtime.getStartDateTime().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Cannot publish a showtime scheduled in the past");
        }
    }

    private void flipHallIfNoActiveShowtimes(Hall hall, Long excludeId) {
        // @TODO --> This should be changed to check other statuses
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
        if (showtime.getStartDateTime().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Cannot publish a showtime scheduled in the past");
        }
        validateShowtimeNotInPast(showtime);
        showtime.setStatus(ShowtimeStatus.PUBLISHED);
        showtimeRepository.save(showtime);
        tmdbMovieService.clearAnnouncement(showtime.getTmdbMovie());
    }

    private void publishDraftsForMovie(Long movieId, LocalDate date) {
        LocalDateTime startDateTime = date != null ? date.atStartOfDay() : null;
        LocalDateTime endDateTime = date != null ? date.plusDays(1).atStartOfDay() : null;
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
        showtime.setStartDateTime(dto.getDateTime());
        showtime.setEndDateTime(dto.getDateTime().plusMinutes(movie.getDurationMinutes()).plusMinutes(CLEANUP_BUFFER_MINUTES));
        showtime.set3D(dto.is3D());
        showtime.setSpecialNotes(dto.getSpecialNotes());
        return showtime;
    }

    private MovieShowtimeListItemDTO toMovieShowtimeListItem(Showtime showtime) {
        Hall hall = showtime.getHall();
        MovieShowtimeListItemDTO dto = new MovieShowtimeListItemDTO();
        dto.setId(showtime.getUuid());
        dto.setTime(showtime.getStartDateTime().toLocalTime().format(TIME_FORMATTER));
        dto.setHall(toHallReference(hall));
        dto.setStatus(showtime.getStatus().name());
        dto.setSpecialNotes(showtime.getSpecialNotes());
        dto.set3D(showtime.is3D());
        dto.setReservedSeats(0);
        dto.setTotalSeats(hall.getTotalRows() * hall.getTotalColumns());
        return dto;
    }

    private MovieWithShowtimesDTO toMovieWithShowtimes(MovieShowtimeCountProjection counts, TmdbMovie movie) {
        MovieWithShowtimesDTO dto = new MovieWithShowtimesDTO();
        dto.setTotalShowtimes(counts.getTotalShowtimes());
        dto.setTotalDraftShowtimes(counts.getTotalDraftShowtimes());
        dto.setMovieDetails(tmdbMovieService.toMovieSummary(movie));
        return dto;
    }

    private ShowtimeSummaryDTO toSummaryDTO(Showtime showtime) {
        Hall hall = showtime.getHall();
        ShowtimeSummaryDTO dto = new ShowtimeSummaryDTO();
        dto.setId(showtime.getUuid());
        dto.setMovie(tmdbMovieService.toMovieSummary(showtime.getTmdbMovie()));
        dto.setHall(toHallReference(hall));
        dto.setStartDateTime(showtime.getStartDateTime());
        dto.setStatus(showtime.getStatus().name());
        dto.setSpecialNotes(showtime.getSpecialNotes());
        dto.set3D(showtime.is3D());
        dto.setReservedSeats(0);
        dto.setTotalSeats(hall.getTotalRows() * hall.getTotalColumns());
        return dto;
    }

    private HallReferenceDTO toHallReference(Hall hall) {
        HallReferenceDTO dto = new HallReferenceDTO();
        dto.setId(hall.getUuid());
        dto.setName(hall.getName());
        return dto;
    }
}
