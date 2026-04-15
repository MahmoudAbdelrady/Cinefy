package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.HallDTO;
import com.mdevs.cinefy.dto.HallDetailDTO;
import com.mdevs.cinefy.dto.HallLayoutDTO;
import com.mdevs.cinefy.dto.HallStatisticsDTO;
import com.mdevs.cinefy.dto.HallSummaryDTO;
import com.mdevs.cinefy.dto.HallTypeDTO;
import com.mdevs.cinefy.service.HallService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/halls")
@RequiredArgsConstructor
public class HallController {

    private final HallService hallService;

    // ========================= Hall Types =========================

    @GetMapping("/types")
    public ResponseEntity<List<HallTypeDTO>> getHallTypes() {
        return ResponseEntity.ok(hallService.getHallTypes());
    }

    @PostMapping("/types")
    public ResponseEntity<HallTypeDTO> createHallType(@Valid @RequestBody HallTypeDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hallService.createHallType(dto));
    }

    @PutMapping("/types/{uuid}")
    public ResponseEntity<HallTypeDTO> updateHallType(@PathVariable String uuid, @Valid @RequestBody HallTypeDTO dto) {
        return ResponseEntity.ok(hallService.updateHallType(uuid, dto));
    }

    @DeleteMapping("/types/{uuid}")
    public ResponseEntity<Void> deleteHallType(@PathVariable String uuid) {
        hallService.deleteHallType(uuid);
        return ResponseEntity.noContent().build();
    }

    // ============================= Halls ===========================

    @GetMapping
    public ResponseEntity<Page<HallSummaryDTO>> getHalls(@RequestParam(required = false) String search,
                                                         @RequestParam(required = false) String excludeHallId,
                                                         Pageable pageable) {
        return ResponseEntity.ok(hallService.getHalls(search, excludeHallId, pageable));
    }

    @GetMapping("/statistics")
    public ResponseEntity<HallStatisticsDTO> getHallsStatistics() {
        return ResponseEntity.ok(hallService.getHallsStatistics());
    }

    @GetMapping("/{uuid}")
    public ResponseEntity<HallDetailDTO> getHall(@PathVariable String uuid) {
        return ResponseEntity.ok(hallService.getHall(uuid));
    }

    @GetMapping("/{uuid}/layout")
    public ResponseEntity<HallLayoutDTO> getHallLayout(@PathVariable String uuid) {
        return ResponseEntity.ok(hallService.getHallLayout(uuid));
    }

    @PostMapping
    public ResponseEntity<HallSummaryDTO> createHall(@Valid @RequestBody HallDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hallService.createHall(dto));
    }

    @PutMapping("/{uuid}")
    public ResponseEntity<HallSummaryDTO> updateHall(@PathVariable String uuid, @Valid @RequestBody HallDTO dto) {
        return ResponseEntity.ok(hallService.updateHall(uuid, dto));
    }

    @DeleteMapping("/{uuid}")
    public ResponseEntity<Void> deleteHall(@PathVariable String uuid) {
        hallService.deleteHall(uuid);
        return ResponseEntity.noContent().build();
    }
}
