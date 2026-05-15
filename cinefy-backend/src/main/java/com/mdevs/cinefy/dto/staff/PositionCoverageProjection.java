package com.mdevs.cinefy.dto.staff;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PositionCoverageProjection {

    private Long total;

    private Long managerCount;

    private Long cashierCount;

    private Long usherCount;
}
