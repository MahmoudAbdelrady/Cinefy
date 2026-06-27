package com.mdevs.cinefy.dto.hall;

import com.mdevs.cinefy.shared.validation.ValidationPatterns;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HallTypeDTO {

    private String id;

    @NotBlank(message = "Name is required")
    @Size(max = 30, message = "Name must not exceed 30 characters")
    @Pattern(regexp = ValidationPatterns.RESOURCE_NAME, message = ValidationPatterns.RESOURCE_NAME_MESSAGE)
    private String name;
}
