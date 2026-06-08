package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.dto.movie.MovieCredits;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSONB")
    private MovieCredits credits;

    private String trailerUrl;

    @Column(nullable = false, columnDefinition = "TIMESTAMP(0)")
    private LocalDateTime lastSyncedAt;

    @Column(nullable = false)
    @ColumnDefault("false")
    private boolean isAnnounced = false;

    @Column(nullable = false)
    @ColumnDefault("false")
    private boolean isHighlighted = false;
}
