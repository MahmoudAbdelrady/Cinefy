package com.mdevs.cinefy.service;

import org.apache.commons.lang3.StringUtils;
import tools.jackson.databind.JsonNode;
import com.mdevs.cinefy.dto.movie.MovieDetailDTO;
import com.mdevs.cinefy.dto.movie.MovieSearchResultDTO;
import com.mdevs.cinefy.dto.movie.UpcomingMovieDTO;
import com.mdevs.cinefy.entity.TmdbMovie;
import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
import com.mdevs.cinefy.repository.ShowtimeRepository;
import com.mdevs.cinefy.repository.TmdbMovieRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import com.mdevs.cinefy.utils.TmdbGenres;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.mdevs.cinefy.shared.exception.types.NotFoundException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Slf4j
@Service
@RequiredArgsConstructor
public class TmdbMovieService {

    private final TmdbMovieRepository tmdbMovieRepository;

    private final ShowtimeRepository showtimeRepository;

    @Value("${app.tmdb.api-base-url}")
    private String apiBaseUrl;

    @Value("${app.tmdb.access-token}")
    private String accessToken;

    @Value("${app.tmdb.image-base-url}")
    private String imageBaseUrl;

    private RestClient restClient;

    @PostConstruct
    private void init() {
        restClient = RestClient.builder()
                .baseUrl(apiBaseUrl)
                .defaultHeader("Authorization", "Bearer " + accessToken)
                .build();
    }

    // ========================= Public API =========================

    public Page<MovieSearchResultDTO> searchMovies(String query, Pageable pageable) {
        Page<MovieSearchResultDTO> page = fetchMoviePage("/search/movie?query={query}&page={page}", pageable, query, pageable.getPageNumber() + 1);
        return new PageImpl<>(page.getContent(), pageable, page.getTotalElements());
    }

    public MovieDetailDTO getMovieDetails(long tmdbId) {
        return tmdbMovieRepository.findById(tmdbId)
                .map(this::toMovieDetail)
                .orElseGet(() -> fetchMovieDetailsFromTmdb(tmdbId));
    }

    public List<UpcomingMovieDTO> getUpcomingMovies(int limit) {
        Page<MovieSearchResultDTO> page = fetchMoviePage("/movie/upcoming?language=en-US&region=us&page={page}", Pageable.unpaged(), 1);
        LocalDate today = LocalDate.now();
        List<MovieSearchResultDTO> upcoming = page.getContent().stream()
                .filter(dto -> StringUtils.isNotEmpty(dto.getReleaseDate()) && !LocalDate.parse(dto.getReleaseDate()).isBefore(today))
                .limit(Math.min(limit, 20))
                .sorted(Comparator.comparing(MovieSearchResultDTO::getReleaseDate))
                .toList();

        List<Long> movieIds = upcoming.stream().map(MovieSearchResultDTO::getId).toList();
        Map<Long, TmdbMovie> localById = tmdbMovieRepository.findAllById(movieIds).stream().collect(Collectors.toMap(TmdbMovie::getId, Function.identity()));
        Set<Long> committedMovieIds = tmdbMovieRepository.findMovieIdsWithShowtimeStatusNot(movieIds, ShowtimeStatus.DRAFT);

        return upcoming.stream()
                .map(dto -> toUpcomingMovie(dto, localById.get(dto.getId()), committedMovieIds.contains(dto.getId())))
                .toList();
    }

    public List<MovieSearchResultDTO> getAnnouncedUpcoming() {
        return tmdbMovieRepository.findAnnouncedUpcoming(LocalDate.now()).stream()
                .map(this::toMovieSearchResult)
                .toList();
    }

    public TmdbMovie findTmdbMovie(long tmdbId) {
        return tmdbMovieRepository.findById(tmdbId).orElseThrow(() -> new NotFoundException("Movie not found: " + tmdbId));
    }

    public TmdbMovie fetchAndCache(long tmdbId) {
        return tmdbMovieRepository.findById(tmdbId).orElseGet(() -> {
            MovieDetailDTO details = fetchMovieDetailsFromTmdb(tmdbId);
            TmdbMovie movie = new TmdbMovie();
            movie.setId(details.getId());
            applyDetailsToMovie(movie, details);
            return tmdbMovieRepository.save(movie);
        });
    }

    @Transactional
    public void setAnnouncement(long tmdbId, boolean announced) {
        if (announced) {
            TmdbMovie movie = fetchAndCache(tmdbId);
            validateAnnounceable(movie);
            movie.setAnnounced(true);
            tmdbMovieRepository.save(movie);
            return;
        }

        TmdbMovie movie = findTmdbMovie(tmdbId);
        if (showtimeRepository.existsByTmdbMovieIdAndStatusNot(movie.getId(), ShowtimeStatus.DRAFT)) {
            throw new BusinessException("'" + movie.getTitle() + "' already has scheduled showtimes");
        }
        movie.setAnnounced(false);
        tmdbMovieRepository.save(movie);
    }

    @Transactional
    public void clearAnnouncement(TmdbMovie movie) {
        if (movie.isAnnounced()) {
            movie.setAnnounced(false);
            tmdbMovieRepository.save(movie);
        }
    }

    @Transactional
    public void reannounceIfEligible(TmdbMovie movie) {
        if (movie.isAnnounced()) {
            return;
        }
        if (movie.getReleaseDate() == null || !movie.getReleaseDate().isAfter(LocalDate.now())) {
            return;
        }
        if (showtimeRepository.existsByTmdbMovieIdAndStatusNot(movie.getId(), ShowtimeStatus.DRAFT)) {
            return;
        }
        movie.setAnnounced(true);
        tmdbMovieRepository.save(movie);
    }

    @Transactional
    public void refreshOrDelete(TmdbMovie movie) {
        MovieDetailDTO details;
        try {
            details = fetchMovieDetailsFromTmdb(movie.getId());
        } catch (NotFoundException e) {
            log.warn("TMDB sync: movie id={} not found upstream, deleting", movie.getId());
            tmdbMovieRepository.delete(movie);
            return;
        }
        applyDetailsToMovie(movie, details);
        tmdbMovieRepository.save(movie);
    }

    @Transactional
    public int deleteOrphans() {
        return tmdbMovieRepository.deleteOrphans(LocalDate.now());
    }

    // =========================== Helpers ===========================

    private void validateAnnounceable(TmdbMovie movie) {
        if (movie.getReleaseDate() == null) {
            throw new BusinessException("'" + movie.getTitle() + "' has no release date yet and cannot be announced");
        }
        if (!movie.getReleaseDate().isAfter(LocalDate.now())) {
            throw new BusinessException("'" + movie.getTitle() + "' has already been released");
        }
        if (showtimeRepository.existsByTmdbMovieIdAndStatusNot(movie.getId(), ShowtimeStatus.DRAFT)) {
            throw new BusinessException("'" + movie.getTitle() + "' already has scheduled showtimes");
        }
    }

    private Page<MovieSearchResultDTO> fetchMoviePage(String uriTemplate, Pageable pageable, Object... uriVars) {
        JsonNode root = restClient.get()
                .uri(uriTemplate, uriVars)
                .retrieve()
                .body(JsonNode.class);

        if (root == null) {
            log.error("Empty response from TMDB for URI template: {}", uriTemplate);
            throw new RuntimeException("Error while retrieving movies");
        }

        List<MovieSearchResultDTO> results = new ArrayList<>();
        for (JsonNode node : root.get("results")) {
            results.add(toMovieSearchResult(node));
        }

        return new PageImpl<>(results, pageable, root.get("total_results").asLong());
    }

    private MovieDetailDTO fetchMovieDetailsFromTmdb(long tmdbId) {
        JsonNode root;
        try {
            root = restClient.get()
                    .uri("/movie/{id}?append_to_response=release_dates", tmdbId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (HttpClientErrorException.NotFound e) {
            throw new NotFoundException("Movie not found: " + tmdbId);
        }

        if (root == null) {
            log.error("Empty response from TMDB for movie id: {}", tmdbId);
            throw new RuntimeException("Error while retrieving movie details");
        }

        return toMovieDetail(root);
    }

    private void applyDetailsToMovie(TmdbMovie movie, MovieDetailDTO details) {
        movie.setTitle(details.getTitle());
        movie.setSynopsis(details.getSynopsis());
        movie.setGenres(details.getGenre());
        movie.setContentRating(details.getContentRating());
        movie.setReleaseDate(StringUtils.isNotEmpty(details.getReleaseDate()) ? LocalDate.parse(details.getReleaseDate()) : null);
        movie.setDurationMinutes(details.getDuration());
        movie.setPosterUrl(details.getPosterUrl());
        movie.setBackdropUrl(details.getBackdropUrl());
        movie.setLastSyncedAt(LocalDateTime.now());
    }

    private MovieSearchResultDTO toMovieSearchResult(JsonNode node) {
        MovieSearchResultDTO dto = new MovieSearchResultDTO();
        dto.setId(node.get("id").longValue());
        dto.setTitle(node.get("title").stringValue());
        dto.setReleaseDate(node.path("release_date").stringValue());

        String posterPath = node.path("poster_path").stringValue();
        dto.setPosterUrl(StringUtils.isNotEmpty(posterPath) ? imageBaseUrl + posterPath : null);

        String backdropPath = node.path("backdrop_path").stringValue();
        dto.setBackdropUrl(StringUtils.isNotEmpty(backdropPath) ? imageBaseUrl + backdropPath : null);

        List<String> genreNames = StreamSupport.stream(node.path("genre_ids").spliterator(), false).map(g -> TmdbGenres.resolve(g.asInt())).toList();
        dto.setGenre(genreNames.isEmpty() ? null : String.join(", ", genreNames));

        return dto;
    }

    private UpcomingMovieDTO toUpcomingMovie(MovieSearchResultDTO source, TmdbMovie local, boolean hasCommittedShowtimes) {
        UpcomingMovieDTO dto = new UpcomingMovieDTO();
        dto.setId(source.getId());
        dto.setTitle(source.getTitle());
        dto.setGenre(source.getGenre());
        dto.setReleaseDate(source.getReleaseDate());
        dto.setPosterUrl(source.getPosterUrl());
        dto.setBackdropUrl(source.getBackdropUrl());
        dto.setAnnounced(local != null && local.isAnnounced());
        dto.setHasCommittedShowtimes(hasCommittedShowtimes);
        return dto;
    }

    private MovieSearchResultDTO toMovieSearchResult(TmdbMovie movie) {
        MovieSearchResultDTO dto = new MovieSearchResultDTO();
        dto.setId(movie.getId());
        dto.setTitle(movie.getTitle());
        dto.setGenre(movie.getGenres());
        dto.setReleaseDate(movie.getReleaseDate() != null ? movie.getReleaseDate().toString() : null);
        dto.setPosterUrl(movie.getPosterUrl());
        dto.setBackdropUrl(movie.getBackdropUrl());
        return dto;
    }

    private MovieDetailDTO toMovieDetail(JsonNode node) {
        MovieDetailDTO dto = new MovieDetailDTO();
        dto.setId(node.get("id").longValue());
        dto.setTitle(node.get("title").stringValue());
        dto.setSynopsis(node.path("overview").stringValue());
        dto.setReleaseDate(node.path("release_date").stringValue());
        dto.setDuration(node.path("runtime").intValue());

        String posterPath = node.path("poster_path").stringValue();
        dto.setPosterUrl(StringUtils.isNotEmpty(posterPath) ? imageBaseUrl + posterPath : null);

        String backdropPath = node.path("backdrop_path").stringValue();
        dto.setBackdropUrl(StringUtils.isNotEmpty(backdropPath) ? imageBaseUrl + backdropPath : null);

        List<String> genreNames = StreamSupport.stream(node.path("genres").spliterator(), false).map(g -> g.path("name").stringValue()).toList();
        dto.setGenre(genreNames.isEmpty() ? null : String.join(", ", genreNames));

        String contentRating = StreamSupport.stream(node.path("release_dates").path("results").spliterator(), false)
                .filter(r -> "US".equals(r.path("iso_3166_1").stringValue()))
                .flatMap(r -> StreamSupport.stream(r.path("release_dates").spliterator(), false))
                .map(r -> r.path("certification").stringValue())
                .filter(StringUtils::isNotEmpty)
                .findFirst()
                .orElse(null);
        dto.setContentRating(contentRating);

        return dto;
    }

    public MovieDetailDTO toMovieDetail(TmdbMovie m) {
        MovieDetailDTO dto = new MovieDetailDTO();
        dto.setId(m.getId());
        dto.setTitle(m.getTitle());
        dto.setSynopsis(m.getSynopsis());
        dto.setGenre(m.getGenres());
        dto.setContentRating(m.getContentRating());
        dto.setReleaseDate(m.getReleaseDate() != null ? m.getReleaseDate().toString() : null);
        dto.setDuration(m.getDurationMinutes());
        dto.setPosterUrl(m.getPosterUrl());
        dto.setBackdropUrl(m.getBackdropUrl());
        return dto;
    }
}
