package com.mdevs.cinefy.dto.movie;

import java.util.List;

public record MovieCredits(List<CreditMember> cast, List<CreditMember> directors) {

    public record CreditMember(Long id, String name) {
    }
}
