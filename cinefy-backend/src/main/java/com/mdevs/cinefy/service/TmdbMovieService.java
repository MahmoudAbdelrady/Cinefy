package com.mdevs.cinefy.service;

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
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.ArrayList;
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
        return fetchMoviePage("/search/movie?query={query}&page={page}", pageable, query, pageable.getPageNumber() + 1);
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

        String genre = StreamSupport.stream(node.path("genre_ids").spliterator(), false)
                .map(g -> TmdbGenres.resolve(g.asInt()))
                .reduce((a, b) -> a + ", " + b)
                .orElse(null);
        dto.setGenre(genre);

        return dto;
    }
}
