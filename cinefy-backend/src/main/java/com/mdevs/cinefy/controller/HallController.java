package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.hall.HallDTO;
import com.mdevs.cinefy.dto.hall.HallDetailDTO;
import com.mdevs.cinefy.dto.hall.HallLayoutDTO;
import com.mdevs.cinefy.dto.hall.HallSummaryDTO;
import com.mdevs.cinefy.dto.hall.HallTypeDTO;
import com.mdevs.cinefy.service.HallService;
import com.mdevs.cinefy.shared.annotation.PublicApi;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/halls")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class HallController {

    private final HallService hallService;

    // ========================= Hall Types =========================

    @PublicApi
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
    public ResponseEntity<List<HallSummaryDTO>> getHalls(@RequestParam(required = false) String excludeHallId,
                                                         @RequestParam(required = false) List<String> statuses) {
        return ResponseEntity.ok(hallService.getHalls(excludeHallId, statuses));
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
