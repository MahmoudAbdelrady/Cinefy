package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.ShowtimeDTO;
import com.mdevs.cinefy.dto.ShowtimeSummaryDTO;
import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.HallStatus;
import com.mdevs.cinefy.entity.Showtime;
import com.mdevs.cinefy.entity.ShowtimeStatus;
import com.mdevs.cinefy.entity.TmdbMovie;
import com.mdevs.cinefy.repository.ShowtimeRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShowtimeService {

    private final ShowtimeRepository showtimeRepository;

    private final HallService hallService;

    private final TmdbMovieService tmdbMovieService;

    private static final int CLEANUP_BUFFER_MINUTES = 15;

    // ========================= Public API =========================

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
        validateShowtime(hall, movie, dto, uuid);

        applyDtoToShowtime(showtime, hall, movie, dto);
        showtimeRepository.save(showtime);

        if (!previousHall.getUuid().equals(hall.getUuid())) {
            flipHallIfNoActiveShowtimes(previousHall, uuid);
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
        flipHallIfNoActiveShowtimes(hall, uuid);
    }

    // =========================== Helpers ===========================

    private Showtime findShowtime(String uuid) {
        return showtimeRepository.findByUuid(uuid).orElseThrow(() -> new NotFoundException("Showtime not found: " + uuid));
    }

    private void validateShowtime(Hall hall, TmdbMovie movie, ShowtimeDTO dto, String showtimeUuid) {
        if (showtimeUuid == null && dto.getMovieId() == null) {
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

        if (movie != null) {
            if (movie.getDurationMinutes() == null || movie.getDurationMinutes() <= 0) {
                throw new BusinessException("Movie '" + movie.getTitle() + "' does not have a runtime yet and cannot be scheduled");
            }

            // Pad the new showtime's end with a cleanup buffer so back-to-back showtimes leave time to reset the hall
            LocalDateTime end = dto.getDateTime().plusMinutes(movie.getDurationMinutes()).plusMinutes(CLEANUP_BUFFER_MINUTES);
            boolean overlaps = showtimeRepository.existsOverlapping(hall, dto.getDateTime(), end, showtimeUuid);
            if (overlaps) {
                throw new BusinessException("Another showtime is already scheduled in this hall at the selected time");
            }
        }
    }

    private void flipHallIfNoActiveShowtimes(Hall hall, String excludeShowtimeUuid) {
        boolean stillHasShowtimes = showtimeRepository.existsByHallAndStatusInAndUuidNot(hall, List.of(ShowtimeStatus.DRAFT, ShowtimeStatus.PUBLISHED), excludeShowtimeUuid);
        if (!stillHasShowtimes) {
            hallService.updateHallStatus(hall, HallStatus.ACTIVE);
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

    private ShowtimeSummaryDTO toSummaryDTO(Showtime showtime) {
        ShowtimeSummaryDTO dto = new ShowtimeSummaryDTO();
        dto.setId(showtime.getUuid());
        dto.setMovie(tmdbMovieService.toMovieDTO(showtime.getTmdbMovie()));
        dto.setHallId(showtime.getHall().getUuid());
        dto.setHallName(showtime.getHall().getName());
        dto.setStartDateTime(showtime.getStartDateTime());
        dto.setStatus(showtime.getStatus().name());
        return dto;
    }
}
