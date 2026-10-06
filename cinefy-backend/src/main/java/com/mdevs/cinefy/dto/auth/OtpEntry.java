package com.mdevs.cinefy.dto.auth;

import com.mdevs.cinefy.entity.enums.OtpType;
import com.mdevs.cinefy.entity.enums.UserType;

public record OtpEntry(

        String code,

        Long userId,

        UserType userType,

        OtpType type
) {

}
