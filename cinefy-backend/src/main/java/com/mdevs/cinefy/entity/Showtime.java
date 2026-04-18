package com.mdevs.cinefy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(indexes = {
        @Index(columnList = "_UUID"),
        @Index(columnList = "STATUS"),
        @Index(columnList = "CREATED_AT"),
        @Index(columnList = "HALL_ID"),
        @Index(columnList = "START_DATE_TIME")
})
public class Showtime extends BaseEntity {

    @Column(nullable = false, columnDefinition = "TIMESTAMP(0)")
    private LocalDateTime startDateTime;

    @Column(columnDefinition = "TIMESTAMP(0)")
    private LocalDateTime endDateTime;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private Hall hall;

    private String specialNotes;

    @Column(nullable = false)
    private boolean is3D = false;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private TmdbMovie tmdbMovie;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShowtimeStatus status;
}
