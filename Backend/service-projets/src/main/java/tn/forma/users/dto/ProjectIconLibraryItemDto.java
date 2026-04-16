package tn.forma.users.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record ProjectIconLibraryItemDto(
        String id,
        String name,
        String slug,
        String category,
        String publicUrl,
        List<String> keywords,
        List<String> tags
) {
}
