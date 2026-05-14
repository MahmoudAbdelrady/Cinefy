package com.mdevs.cinefy.dto.staff;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PositionCoverageDTO {

    private Long total;

    private List<PositionCoverageItemDTO> positions;
}
