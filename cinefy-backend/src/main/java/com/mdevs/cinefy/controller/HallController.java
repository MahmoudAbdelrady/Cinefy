package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.HallDTO;
import com.mdevs.cinefy.service.HallService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/halls")
@RequiredArgsConstructor
public class HallController {

    private final HallService hallService;

    @PostMapping
    public ResponseEntity<HallDTO> createHall(@Valid @RequestBody HallDTO dto) {
        HallDTO result = hallService.createHall(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
}
