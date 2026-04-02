package com.mdevs.cinefy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "seats")
public class Seat extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hall_id", nullable = false)
    private Hall hall;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal ticketPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeatCategory category;

    @Column(name = "seat_row", nullable = false)
    private String row;

    @Column(name = "seat_column", nullable = false)
    private String column;

    @Column(nullable = false)
    private Boolean onSiteOnly = false;
}
