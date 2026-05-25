package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
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
        @Index(columnList = "STATUS"),
        @Index(columnList = "CREATED_AT"),
        @Index(columnList = "HALL_ID"),
        @Index(columnList = "START_DATE_TIME"),
        @Index(columnList = "END_DATE_TIME"),
        @Index(columnList = "TMDB_MOVIE_ID, STATUS, START_DATE_TIME"),
        @Index(columnList = "START_DATE_TIME, END_DATE_TIME"),
        @Index(columnList = "HALL_ID, STATUS")
})
public class Showtime extends BaseEntity {

    @Column(nullable = false, columnDefinition = "TIMESTAMP(0)")
    private LocalDateTime startDateTime;

    @Column(nullable = false, columnDefinition = "TIMESTAMP(0)")
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
    private ShowtimeStatus status = ShowtimeStatus.DRAFT;
}
