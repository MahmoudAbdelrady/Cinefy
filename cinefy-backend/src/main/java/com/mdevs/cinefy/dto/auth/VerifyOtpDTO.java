package com.mdevs.cinefy.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyOtpDTO {

    @NotBlank(message = "Code is required")
    private String code;

    @NotBlank(message = "Type is required")
    private String type;
}
