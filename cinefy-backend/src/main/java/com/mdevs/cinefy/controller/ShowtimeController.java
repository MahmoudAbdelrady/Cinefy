package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.ShowtimeDTO;
import com.mdevs.cinefy.dto.ShowtimeSummaryDTO;
import com.mdevs.cinefy.service.ShowtimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {

    private final ShowtimeService showtimeService;

    @PostMapping
    public ResponseEntity<ShowtimeSummaryDTO> createShowtime(@Valid @RequestBody ShowtimeDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(showtimeService.createShowtime(dto));
    }

    @PutMapping("/{uuid}")
    public ResponseEntity<ShowtimeSummaryDTO> updateShowtime(@PathVariable String uuid, @Valid @RequestBody ShowtimeDTO dto) {
        return ResponseEntity.ok(showtimeService.updateShowtime(uuid, dto));
    }

    @DeleteMapping("/{uuid}")
    public ResponseEntity<Void> deleteShowtime(@PathVariable String uuid) {
        showtimeService.deleteShowtime(uuid);
        return ResponseEntity.noContent().build();
    }
}
