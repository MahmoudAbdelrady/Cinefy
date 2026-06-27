package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.booking.SeatSelectionDTO;
import com.mdevs.cinefy.dto.hall.HallLayoutDTO;
import com.mdevs.cinefy.entity.Hall;
import com.mdevs.cinefy.entity.Showtime;
import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
import com.mdevs.cinefy.repository.BookingRepository;
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
public class BookingService {

    private final ShowtimeRepository showtimeRepository;

    private final BookingRepository bookingRepository;

    private final HallService hallService;

    // ========================= Public API =========================

    public SeatSelectionDTO getSeatSelection(String showtimeUuid) {
        Showtime showtime = findBookableShowtime(showtimeUuid);
        Hall hall = showtime.getHall();

        HallLayoutDTO hallLayout = hallService.getHallLayout(hall);
        hallLayout.getLayout().setReserved(getReservedSeats(showtime));

        return toSeatSelectionDTO(showtime, hall, hallLayout);
    }

    @Transactional
    public int deleteExpiredPendingBookings(LocalDateTime cutOffDate) {
        return bookingRepository.deleteExpiredPending(cutOffDate);
    }

    // =========================== Helpers ===========================

    private Showtime findBookableShowtime(String uuid) {
        Showtime showtime = showtimeRepository.findByUuidWithHallLayout(uuid)
                .orElseThrow(() -> new NotFoundException("Showtime not found: " + uuid));
        if (!ShowtimeStatus.COMMITTED_STATUSES.contains(showtime.getStatus())) {
            throw new BusinessException("This showtime is not available for booking");
        }
        return showtime;
    }

    // TODO: populate from the Reservation entity once it exists. Until then no seat is
    // reserved, so an empty list is the correct "nothing reserved yet" state.
    private List<String> getReservedSeats(Showtime showtime) {
        return List.of();
    }

    private SeatSelectionDTO toSeatSelectionDTO(Showtime showtime, Hall hall, HallLayoutDTO hallLayout) {
        SeatSelectionDTO dto = new SeatSelectionDTO();
        dto.setMovieTitle(showtime.getTmdbMovie().getTitle());
        dto.setStartDateTime(showtime.getStartDateTime());
        dto.setHallName(hall.getName());
        dto.setHallType(hall.getType().getName());
        dto.set3D(showtime.is3D());
        dto.setHallLayout(hallLayout);
        return dto;
    }
}
