package com.mdevs.cinefy.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OAuthCallbackDTO {

    @NotBlank(message = "Code is required")
    private String code;

    @NotBlank(message = "State is required")
    private String state;
}
