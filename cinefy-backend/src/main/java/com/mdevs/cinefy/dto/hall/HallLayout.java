package com.mdevs.cinefy.dto.hall;

import com.mdevs.cinefy.entity.enums.SeatCategory;

import java.util.List;
import java.util.Map;

public record HallLayout(

        Map<SeatCategory, List<String>> categories,

        List<String> onSiteOnly
) {
}
