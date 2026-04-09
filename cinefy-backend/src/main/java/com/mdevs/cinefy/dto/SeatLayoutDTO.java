package com.mdevs.cinefy.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class SeatLayoutDTO {

    private Map<String, List<String>> categories;

    private List<String> onSiteOnly;
}
