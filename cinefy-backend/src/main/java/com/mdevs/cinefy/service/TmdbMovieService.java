package com.mdevs.cinefy.service;

import org.apache.commons.lang3.StringUtils;
import tools.jackson.databind.JsonNode;
import com.mdevs.cinefy.dto.MovieSearchResultDTO;
import com.mdevs.cinefy.repository.TmdbMovieRepository;
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
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.StreamSupport;

@Slf4j
@Service
@RequiredArgsConstructor
public class TmdbMovieService {

    private final TmdbMovieRepository tmdbMovieRepository;

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
        List<MovieSearchResultDTO> sorted = page.getContent().stream()
                .sorted(Comparator.comparing(dto -> dto.getReleaseDate() != null ? dto.getReleaseDate() : "", Comparator.reverseOrder()))
                .toList();
        return new PageImpl<>(sorted, pageable, page.getTotalElements());
    }

    public MovieSearchResultDTO getMovieDetails(long tmdbId) {
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

    public List<MovieSearchResultDTO> getUpcomingMovies(int limit) {
        Page<MovieSearchResultDTO> page = fetchMoviePage("/movie/upcoming?language=en-US&region=us&page={page}", Pageable.unpaged(), 1);
        LocalDate today = LocalDate.now();
        return page.getContent().stream()
                .filter(dto -> dto.getReleaseDate() != null && !LocalDate.parse(dto.getReleaseDate()).isBefore(today))
                .limit(Math.min(limit, 20))
                .toList();
    }

    // =========================== Helpers ===========================

    private Page<MovieSearchResultDTO> fetchMoviePage(String uriTemplate, Pageable pageable, Object... uriVars) {
        JsonNode root = restClient.get()
                .uri(uriTemplate, uriVars)
                .retrieve()
                .body(JsonNode.class);

        if (root == null) {
            log.error("Empty response from TMDB for URI template: {}", uriTemplate);
            throw new RuntimeException("Error while retrieving movies");
        }

        long totalResults = root.get("total_results").asLong();

        List<MovieSearchResultDTO> results = new ArrayList<>();
        for (JsonNode node : root.get("results")) {
            results.add(toMovieSearchResult(node));
        }

        return new PageImpl<>(results, pageable, totalResults);
    }

    private MovieSearchResultDTO toMovieSearchResult(JsonNode node) {
        MovieSearchResultDTO dto = new MovieSearchResultDTO();
        dto.setId(node.get("id").longValue());
        dto.setTitle(node.get("title").stringValue());
        dto.setReleaseDate(node.path("release_date").stringValue());

        String posterPath = node.path("poster_path").stringValue();
        dto.setPosterUrl(posterPath != null ? imageBaseUrl + posterPath : null);

        List<String> genreNames = StreamSupport.stream(node.path("genre_ids").spliterator(), false).map(g -> TmdbGenres.resolve(g.asInt())).toList();
        dto.setGenre(genreNames.isEmpty() ? null : String.join(", ", genreNames));

        return dto;
    }

    private MovieSearchResultDTO toMovieDetail(JsonNode node) {
        MovieSearchResultDTO dto = new MovieSearchResultDTO();
        dto.setId(node.get("id").longValue());
        dto.setTitle(node.get("title").stringValue());
        dto.setReleaseDate(node.path("release_date").stringValue());
        dto.setDuration(node.path("runtime").intValue());

        String posterPath = node.path("poster_path").stringValue();
        dto.setPosterUrl(posterPath != null ? imageBaseUrl + posterPath : null);

        List<String> genreNames = StreamSupport.stream(node.path("genres").spliterator(), false).map(g -> g.path("name").stringValue()).toList();
        dto.setGenre(genreNames.isEmpty() ? null : String.join(", ", genreNames));

        String rating = StreamSupport.stream(node.path("release_dates").path("results").spliterator(), false)
                .filter(r -> "US".equals(r.path("iso_3166_1").stringValue()))
                .flatMap(r -> StreamSupport.stream(r.path("release_dates").spliterator(), false))
                .map(r -> r.path("certification").stringValue())
                .filter(StringUtils::isNotEmpty)
                .findFirst()
                .orElse(null);
        dto.setRating(rating);

        return dto;
    }
}
