package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.entity.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"CLIENT_ID", "SHOWTIME_ID", "ON_HOLD"}),
        indexes = {
                @Index(columnList = "SHOWTIME_ID"),
                @Index(columnList = "ON_HOLD, EXPIRES_AT"),
                @Index(columnList = "CLIENT_ID"),
                @Index(columnList = "BOOKED_BY_ID")
        }
)
public class Booking extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private Showtime showtime;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private Hall hall;

    @Column(nullable = false)
    private String hallName;

    @Column(nullable = false)
    private String hallType;

    @ManyToOne(fetch = FetchType.LAZY)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    private StaffMember bookedBy;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<BookingSeat> seats = new HashSet<>();

    @Column(nullable = false, unique = true)
    private String idempotencyKey;

    @Column(nullable = false, unique = true)
    private String bookingReference;

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    @Column(unique = true)
    private String paymentTransactionId;

    private Boolean onHold = true;

    @Column(columnDefinition = "TIMESTAMP(0)")
    private LocalDateTime refundableUntil;

    @Column(nullable = false, columnDefinition = "TIMESTAMP(0)")
    private LocalDateTime expiresAt;

    @Column(unique = true)
    private String ticketToken;

    @Column(nullable = false)
    @ColumnDefault("false")
    private boolean ticketUsed = false;
}
