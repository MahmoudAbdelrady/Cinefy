package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.entity.enums.SeatCategory;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"SHOWTIME_ID", "POSITION", "ACTIVE"}),
        indexes = @Index(columnList = "BOOKING_ID")
)
public class BookingSeat extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private Showtime showtime;

    @Column(nullable = false)
    private String position;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeatCategory category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal ticketPrice;

    private Boolean active = true;
}
