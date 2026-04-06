package com.mdevs.cinefy.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HallSummaryDTO {

    private String id;

    private String name;

    private String status;

    private String typeName;

    private boolean supports3D;

    private int totalRows;

    private int totalColumns;
}
