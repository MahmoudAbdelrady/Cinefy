package com.mdevs.cinefy.dto.email;

public record InlineResource(String contentId, String contentType, byte[] content) {
}
