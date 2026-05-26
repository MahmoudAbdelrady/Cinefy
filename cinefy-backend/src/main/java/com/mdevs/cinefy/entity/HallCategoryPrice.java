package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.entity.enums.SeatCategory;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"HALL_ID", "CATEGORY"}),
        indexes = @Index(columnList = "HALL_ID")
)
public class HallCategoryPrice extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private Hall hall;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeatCategory category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal ticketPrice;
}
