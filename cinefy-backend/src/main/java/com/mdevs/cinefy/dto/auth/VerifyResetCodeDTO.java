package com.mdevs.cinefy.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyResetCodeDTO {

    @NotBlank(message = "Code is required")
    private String code;
}
