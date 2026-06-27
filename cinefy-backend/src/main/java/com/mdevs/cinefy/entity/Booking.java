package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.entity.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

import org.hibernate.annotations.ColumnDefault;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(indexes = @Index(columnList = "STATUS, EXPIRES_AT"))
public class Booking extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private TmdbMovie tmdbMovie;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private Showtime showtime;

    @ManyToOne(fetch = FetchType.LAZY)
    private Client client;

    @Column(nullable = false)
    @ColumnDefault("false")
    private boolean isRefunded = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(columnDefinition = "TIMESTAMP(0)")
    private LocalDateTime refundableUntil;

    @Column(nullable = false, columnDefinition = "TIMESTAMP(0)")
    private LocalDateTime expiresAt;
}
