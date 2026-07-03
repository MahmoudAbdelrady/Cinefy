package com.mdevs.cinefy.dto.hall;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SeatLayoutDTO {

    private Map<String, List<String>> categories;

    private List<String> onSiteOnly;

    private List<String> reserved;

    private List<String> myReserved;
}
