package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.ShowtimeDTO;
import com.mdevs.cinefy.dto.ShowtimeSummaryDTO;
import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.HallStatus;
import com.mdevs.cinefy.entity.Showtime;
import com.mdevs.cinefy.entity.TmdbMovie;
import com.mdevs.cinefy.repository.ShowtimeRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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
        TmdbMovie movie = tmdbMovieService.fetchAndCache(dto.getMovieId());
        validateShowtime(hall, movie, dto);

        Showtime showtime = new Showtime();
        showtime.setTmdbMovie(movie);
        showtime.setHall(hall);
        showtime.setStartDateTime(dto.getDateTime());
        showtime.setEndDateTime(dto.getDateTime().plusMinutes(movie.getDurationMinutes()));
        showtime.set3D(dto.is3D());
        showtime.setSpecialNotes(dto.getSpecialNotes());
        showtimeRepository.save(showtime);

        hallService.updateHallStatus(hall, HallStatus.SCHEDULED);

        return toSummaryDTO(showtime);
    }

    // =========================== Helpers ===========================

    private void validateShowtime(Hall hall, TmdbMovie movie, ShowtimeDTO dto) {
        if (!hall.getStatus().equals(HallStatus.ACTIVE)) {
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

        // Pad the new showtime's end with a cleanup buffer so back-to-back showtimes leave time to reset the hall
        LocalDateTime end = dto.getDateTime().plusMinutes(movie.getDurationMinutes()).plusMinutes(CLEANUP_BUFFER_MINUTES);
        boolean overlaps = showtimeRepository.existsOverlapping(hall, dto.getDateTime(), end);
        if (overlaps) {
            throw new BusinessException("Another showtime is already scheduled in this hall at the selected time");
        }
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
