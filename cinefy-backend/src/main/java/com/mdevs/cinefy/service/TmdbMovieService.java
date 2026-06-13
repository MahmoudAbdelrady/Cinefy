package com.mdevs.cinefy.service;

import org.apache.commons.lang3.StringUtils;
import tools.jackson.databind.JsonNode;
import com.mdevs.cinefy.dto.movie.HighlightedMovieDTO;
import com.mdevs.cinefy.dto.movie.MovieCredits;
import com.mdevs.cinefy.dto.movie.MovieDetailDTO;
import com.mdevs.cinefy.dto.movie.MovieSearchResultDTO;
import com.mdevs.cinefy.dto.movie.MovieSummaryDTO;
import com.mdevs.cinefy.dto.movie.MovieWithCommittedShowtimeProjection;
import com.mdevs.cinefy.dto.movie.NowShowingMovieDTO;
import com.mdevs.cinefy.dto.movie.UpcomingMovieDTO;
import com.mdevs.cinefy.entity.TmdbMovie;
import com.mdevs.cinefy.entity.enums.ShowtimeStatus;
import com.mdevs.cinefy.repository.ShowtimeRepository;
import com.mdevs.cinefy.repository.TmdbMovieRepository;
import com.mdevs.cinefy.shared.exception.types.BusinessException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

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

    private static final int TMDB_RELEASE_TYPE_THEATRICAL = 3;

    private static final int TMDB_RELEASE_TYPE_THEATRICAL_LIMITED = 2;

    private static final int MAX_HIGHLIGHTED_MOVIES = 5;

    private static final int MAX_CAST_MEMBERS = 6;

    private static final String BACKDROP_SIZE = "original";

    private static final String POSTER_SIZE = "w500";

    private static final String PROFILE_SIZE = "w185";

    private static final Map<Integer, String> TMDB_GENRES = Map.ofEntries(
            Map.entry(28, "Action"),
            Map.entry(12, "Adventure"),
            Map.entry(16, "Animation"),
            Map.entry(35, "Comedy"),
            Map.entry(80, "Crime"),
            Map.entry(99, "Documentary"),
            Map.entry(18, "Drama"),
            Map.entry(10751, "Family"),
            Map.entry(14, "Fantasy"),
            Map.entry(36, "History"),
            Map.entry(27, "Horror"),
            Map.entry(10402, "Music"),
            Map.entry(9648, "Mystery"),
            Map.entry(10749, "Romance"),
            Map.entry(878, "Science Fiction"),
            Map.entry(10770, "TV Movie"),
            Map.entry(53, "Thriller"),
            Map.entry(10752, "War"),
            Map.entry(37, "Western")
    );

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
        Page<MovieSearchResultDTO> page = fetchMoviePage("/movie/upcoming?language=en-US&region=us&page=1", Pageable.unpaged());
        LocalDate today = LocalDate.now();
        List<MovieSearchResultDTO> upcoming = page.getContent().stream()
                .filter(dto -> StringUtils.isNotEmpty(dto.getReleaseDate()) && !LocalDate.parse(dto.getReleaseDate()).isBefore(today))
                .sorted(Comparator.comparing(MovieSearchResultDTO::getReleaseDate))
                .limit(Math.min(limit, 20))
                .toList();

        List<Long> movieIds = upcoming.stream().map(MovieSearchResultDTO::getId).toList();
        Map<Long, MovieWithCommittedShowtimeProjection> moviesById = tmdbMovieRepository.findMoviesWithCommittedShowtime(movieIds, ShowtimeStatus.COMMITTED_STATUSES).stream()
                .collect(Collectors.toMap(row -> row.getMovie().getId(), Function.identity()));

        return upcoming.stream()
                .map(dto -> {
                    MovieWithCommittedShowtimeProjection row = moviesById.get(dto.getId());
                    TmdbMovie local = row != null ? row.getMovie() : null;
                    boolean hasCommittedShowtimes = row != null && row.getHasCommittedShowtime();
                    return toUpcomingMovie(dto, local, hasCommittedShowtimes);
                })
                .toList();
    }

    public List<MovieSearchResultDTO> getAnnouncedUpcoming() {
        return tmdbMovieRepository.findAnnouncedUpcoming(LocalDate.now()).stream()
                .map(this::toMovieSearchResult)
                .toList();
    }

    public List<HighlightedMovieDTO> getHighlighted() {
        return tmdbMovieRepository.findHighlightedWithBookingFlag(LocalDate.now(), ShowtimeStatus.COMMITTED_STATUSES).stream()
                .map(row -> toHighlightedMovie(row.getMovie(), row.getHasCommittedShowtime()))
                .toList();
    }

    public List<NowShowingMovieDTO> getNowShowing(Integer limit) {
        Pageable pageable = limit != null ? PageRequest.of(0, limit) : Pageable.unpaged();
        return tmdbMovieRepository.findNowShowingWith3DFlag(ShowtimeStatus.COMMITTED_STATUSES, pageable).stream()
                .map(row -> toNowShowingMovie(row.getMovie(), row.getIs3D()))
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
        if (showtimeRepository.existsByTmdbMovieIdAndStatusIn(movie.getId(), ShowtimeStatus.COMMITTED_STATUSES)) {
            throw new BusinessException("'" + movie.getTitle() + "' already has scheduled showtimes");
        }
        movie.setAnnounced(false);
        movie.setHighlighted(false);
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
    public void setHighlight(long tmdbId, boolean highlighted) {
        TmdbMovie movie = findTmdbMovie(tmdbId);
        validateHighlightEligible(movie);
        if (highlighted && !movie.isHighlighted()) {
            validateHighlightCapacity();
        }
        movie.setHighlighted(highlighted);
        tmdbMovieRepository.save(movie);
    }

    @Transactional
    public void clearHighlightIfIneligible(TmdbMovie movie) {
        if (!movie.isHighlighted()) {
            return;
        }
        boolean hasCommittedShowtimes = showtimeRepository.existsByTmdbMovieIdAndStatusIn(movie.getId(), ShowtimeStatus.COMMITTED_STATUSES);
        if (!hasCommittedShowtimes && !movie.isAnnounced()) {
            movie.setHighlighted(false);
            tmdbMovieRepository.save(movie);
        }
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
        if (showtimeRepository.existsByTmdbMovieIdAndStatusIn(movie.getId(), ShowtimeStatus.COMMITTED_STATUSES)) {
            throw new BusinessException("'" + movie.getTitle() + "' already has scheduled showtimes");
        }
    }

    private void validateHighlightEligible(TmdbMovie movie) {
        boolean hasCommittedShowtimes = showtimeRepository.existsByTmdbMovieIdAndStatusIn(movie.getId(), ShowtimeStatus.COMMITTED_STATUSES);
        if (!hasCommittedShowtimes && !movie.isAnnounced()) {
            throw new BusinessException("'" + movie.getTitle() + "' must be announced or have scheduled showtimes to be highlighted");
        }
    }

    private void validateHighlightCapacity() {
        if (tmdbMovieRepository.countByIsHighlightedTrue() >= MAX_HIGHLIGHTED_MOVIES) {
            throw new BusinessException("You can highlight at most " + MAX_HIGHLIGHTED_MOVIES + " movies");
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
                    .uri("/movie/{id}?append_to_response=release_dates,credits,videos", tmdbId)
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
        movie.setCredits(details.getCredits());
        movie.setTrailerUrl(details.getTrailerUrl());
        movie.setLastSyncedAt(LocalDateTime.now());
    }

    private MovieSearchResultDTO toMovieSearchResult(JsonNode node) {
        MovieSearchResultDTO dto = new MovieSearchResultDTO();
        dto.setId(node.get("id").longValue());
        dto.setTitle(node.get("title").stringValue());
        dto.setReleaseDate(node.path("release_date").stringValue());

        String posterPath = node.path("poster_path").stringValue();
        dto.setPosterUrl(toImageUrl(POSTER_SIZE, posterPath));

        String backdropPath = node.path("backdrop_path").stringValue();
        dto.setBackdropUrl(toImageUrl(BACKDROP_SIZE, backdropPath));

        List<String> genreNames = node.path("genre_ids").valueStream().map(g -> resolveGenre(g.asInt())).toList();
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
        dto.setHighlighted(local != null && local.isHighlighted());
        dto.setHasCommittedShowtimes(hasCommittedShowtimes);
        return dto;
    }

    private HighlightedMovieDTO toHighlightedMovie(TmdbMovie movie, boolean bookingOpened) {
        HighlightedMovieDTO dto = new HighlightedMovieDTO();
        dto.setBookingOpened(bookingOpened);
        dto.setMovieDetails(toMovieDetail(movie));
        return dto;
    }

    private NowShowingMovieDTO toNowShowingMovie(TmdbMovie movie, boolean is3D) {
        NowShowingMovieDTO dto = new NowShowingMovieDTO();
        dto.setId(movie.getId());
        dto.setTitle(movie.getTitle());
        dto.setGenre(movie.getGenres());
        dto.setReleaseDate(movie.getReleaseDate() != null ? movie.getReleaseDate().toString() : null);
        dto.setPosterUrl(movie.getPosterUrl());
        dto.setBackdropUrl(movie.getBackdropUrl());
        dto.set3D(is3D);
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
        dto.setDuration(node.path("runtime").intValue());

        String posterPath = node.path("poster_path").stringValue();
        dto.setPosterUrl(toImageUrl(POSTER_SIZE, posterPath));

        String backdropPath = node.path("backdrop_path").stringValue();
        dto.setBackdropUrl(toImageUrl(BACKDROP_SIZE, backdropPath));

        List<String> genreNames = node.path("genres").valueStream().map(g -> g.path("name").stringValue()).toList();
        dto.setGenre(genreNames.isEmpty() ? null : String.join(", ", genreNames));

        List<JsonNode> usReleaseDates = node.path("release_dates").path("results").valueStream()
                .filter(r -> "US".equals(r.path("iso_3166_1").stringValue()))
                .flatMap(r -> r.path("release_dates").valueStream())
                .toList();

        dto.setReleaseDate(resolveUsReleaseDate(usReleaseDates, node.path("release_date").stringValue()));

        String contentRating = usReleaseDates.stream()
                .map(r -> r.path("certification").stringValue())
                .filter(StringUtils::isNotEmpty)
                .findFirst()
                .orElse(null);
        dto.setContentRating(contentRating);

        dto.setCredits(resolveCredits(node.path("credits")));
        dto.setTrailerUrl(resolveTrailerUrl(node.path("videos").path("results")));

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
        dto.setCredits(m.getCredits());
        dto.setTrailerUrl(m.getTrailerUrl());
        return dto;
    }

    public MovieSummaryDTO toMovieSummary(TmdbMovie m) {
        MovieSummaryDTO dto = new MovieSummaryDTO();
        dto.setId(m.getId());
        dto.setTitle(m.getTitle());
        dto.setGenre(m.getGenres());
        dto.setContentRating(m.getContentRating());
        dto.setReleaseDate(m.getReleaseDate() != null ? m.getReleaseDate().toString() : null);
        dto.setDuration(m.getDurationMinutes());
        dto.setPosterUrl(m.getPosterUrl());
        dto.setBackdropUrl(m.getBackdropUrl());
        dto.setHighlighted(m.isHighlighted());
        return dto;
    }

    private String resolveUsReleaseDate(List<JsonNode> usReleaseDates, String primaryReleaseDate) {
        String resolved = Optional.ofNullable(firstUsDateOfType(usReleaseDates, TMDB_RELEASE_TYPE_THEATRICAL))
                .or(() -> Optional.ofNullable(firstUsDateOfType(usReleaseDates, TMDB_RELEASE_TYPE_THEATRICAL_LIMITED)))
                .orElse(primaryReleaseDate);

        // Trim TMDB's full timestamp to yyyy-MM-dd so it matches the upcoming list's format.
        return StringUtils.isNotEmpty(resolved) && resolved.length() >= 10 ? resolved.substring(0, 10) : resolved;
    }

    private String firstUsDateOfType(List<JsonNode> usReleaseDates, int releaseType) {
        return usReleaseDates.stream()
                .filter(r -> r.path("type").asInt(Integer.MAX_VALUE) == releaseType)
                .map(r -> r.path("release_date").stringValue(null))
                .filter(StringUtils::isNotEmpty)
                .findFirst()
                .orElse(null);
    }

    private String resolveGenre(int id) {
        return TMDB_GENRES.getOrDefault(id, "Unknown");
    }

    private MovieCredits resolveCredits(JsonNode credits) {
        if (credits.isMissingNode()) {
            return null;
        }

        List<MovieCredits.CreditMember> cast = credits.path("cast").valueStream()
                .sorted(Comparator.comparingInt(c -> c.path("order").asInt(Integer.MAX_VALUE)))
                .limit(MAX_CAST_MEMBERS)
                .map(this::toCreditMember)
                .toList();

        List<MovieCredits.CreditMember> directors = credits.path("crew").valueStream()
                .filter(c -> "Director".equals(c.path("job").stringValue(null)))
                .map(this::toCreditMember)
                .toList();

        if (cast.isEmpty() && directors.isEmpty()) {
            return null;
        }

        return new MovieCredits(cast, directors);
    }

    private MovieCredits.CreditMember toCreditMember(JsonNode person) {
        String profilePath = person.path("profile_path").stringValue(null);
        String profileUrl = toImageUrl(PROFILE_SIZE, profilePath);
        return new MovieCredits.CreditMember(person.get("id").longValue(0), person.path("name").stringValue(null), profileUrl);
    }

    private String resolveTrailerUrl(JsonNode videos) {
        List<JsonNode> youtubeVideos = videos.valueStream()
                .filter(v -> "YouTube".equals(v.path("site").stringValue(null)))
                .toList();

        JsonNode trailer = youtubeVideos.stream()
                .filter(v -> "Trailer".equals(v.path("type").stringValue(null)))
                .max(Comparator.comparing(v -> v.path("published_at").stringValue("")))
                .or(() -> youtubeVideos.stream().filter(v -> "Teaser".equals(v.path("type").stringValue(null))).findFirst())
                .orElse(null);

        if (trailer == null) {
            return null;
        }

        String key = trailer.path("key").stringValue(null);
        return StringUtils.isNotEmpty(key) ? "https://www.youtube.com/embed/" + key : null;
    }

    private String toImageUrl(String size, String path) {
        return StringUtils.isNotEmpty(path) ? imageBaseUrl + "/" + size + path : null;
    }
}
