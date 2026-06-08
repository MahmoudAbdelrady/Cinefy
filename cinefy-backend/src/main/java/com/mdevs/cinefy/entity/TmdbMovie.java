package com.mdevs.cinefy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(indexes = {
        @Index(columnList = "IS_ANNOUNCED, RELEASE_DATE"),
        @Index(columnList = "IS_HIGHLIGHTED")
})
public class TmdbMovie {

    @Id
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String synopsis;

    private String genres;

    private String contentRating;

    private LocalDate releaseDate;

    private Integer durationMinutes;

    private String posterUrl;

    private String backdropUrl;

    @Column(nullable = false, columnDefinition = "TIMESTAMP(0)")
    private LocalDateTime lastSyncedAt;

    @Column(nullable = false)
    @ColumnDefault("false")
    private boolean isAnnounced = false;

    @Column(nullable = false)
    @ColumnDefault("false")
    private boolean isHighlighted = false;
}
