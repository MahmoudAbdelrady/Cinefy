package com.mdevs.cinefy.utils;

import java.util.Map;

public final class TmdbGenres {

    private TmdbGenres() {}

    public static final Map<Integer, String> GENRES = Map.ofEntries(
            Map.entry(28,    "Action"),
            Map.entry(12,    "Adventure"),
            Map.entry(16,    "Animation"),
            Map.entry(35,    "Comedy"),
            Map.entry(80,    "Crime"),
            Map.entry(99,    "Documentary"),
            Map.entry(18,    "Drama"),
            Map.entry(10751, "Family"),
            Map.entry(14,    "Fantasy"),
            Map.entry(36,    "History"),
            Map.entry(27,    "Horror"),
            Map.entry(10402, "Music"),
            Map.entry(9648,  "Mystery"),
            Map.entry(10749, "Romance"),
            Map.entry(878,   "Science Fiction"),
            Map.entry(10770, "TV Movie"),
            Map.entry(53,    "Thriller"),
            Map.entry(10752, "War"),
            Map.entry(37,    "Western")
    );

    public static String resolve(int id) {
        return GENRES.getOrDefault(id, "Unknown");
    }
}
