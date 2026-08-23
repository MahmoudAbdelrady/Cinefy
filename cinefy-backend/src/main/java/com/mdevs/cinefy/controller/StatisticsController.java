package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.statistics.DateRangeDTO;
import com.mdevs.cinefy.dto.statistics.SalesPointDTO;
import com.mdevs.cinefy.dto.statistics.StatisticsSummaryDTO;
import com.mdevs.cinefy.service.StatisticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/statistics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/summary")
    public ResponseEntity<StatisticsSummaryDTO> getSummary(@Valid @ModelAttribute DateRangeDTO range) {
        return ResponseEntity.ok(statisticsService.getSummary(range));
    }

    @GetMapping("/sales")
    public ResponseEntity<List<SalesPointDTO>> getSales(@Valid @ModelAttribute DateRangeDTO range) {
        return ResponseEntity.ok(statisticsService.getSales(range));
    }
}
