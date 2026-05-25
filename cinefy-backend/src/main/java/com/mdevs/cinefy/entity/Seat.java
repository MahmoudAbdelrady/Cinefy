package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.entity.enums.SeatCategory;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(indexes = @Index(columnList = "HALL_ID"))
public class Seat extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private Hall hall;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeatCategory category;

    @Column(nullable = false)
    private String rowPosition;

    @Column(nullable = false)
    private String columnPosition;

    @Column(nullable = false)
    private boolean onSiteOnly = false;

    public String getPosition() {
        return rowPosition + columnPosition;
    }
}
