package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.entity.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.Instant;
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
                @Index(columnList = "CLIENT_ID, CREATED_AT"),
                @Index(columnList = "BOOKED_BY_ID"),
                @Index(columnList = "PAYMENT_GATEWAY_ID")
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

    @Column(unique = true)
    private String bookingReference;

    @Column(columnDefinition = "TEXT")
    private String ticketQrCode;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    private PaymentGateway paymentGateway;

    @Column(unique = true)
    private String paymentTransactionId;

    private Boolean onHold = true;

    @Column(nullable = false, columnDefinition = "TIMESTAMPTZ(0)")
    private Instant expiresAt;

    @Column(nullable = false)
    @ColumnDefault("false")
    private boolean ticketUsed = false;

    public boolean hasExpired() {
        return hasExpired(Instant.now());
    }

    public boolean hasExpired(Instant asOf) {
        return !expiresAt.isAfter(asOf);
    }

    public boolean isActiveHold() {
        return isActiveHold(Instant.now());
    }

    public boolean isActiveHold(Instant asOf) {
        return Boolean.TRUE.equals(onHold) && !hasExpired(asOf);
    }
}
