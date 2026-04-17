package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.ProjectIconLibraryItemDto;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectIconLibraryService {

    private static final int DEFAULT_LIMIT = 24;
    private static final int MAX_LIMIT = 60;
    private static final String LEGACY_BUCKET_SEGMENT = "/storage/v1/object/public/icons/";
    private static final String CURRENT_BUCKET_SEGMENT = "/storage/v1/object/public/icon/";

    private final JdbcTemplate jdbcTemplate;
    private final ProjectService projectService;

    @Transactional(readOnly = true)
    public List<ProjectIconLibraryItemDto> searchProjectIcons(String email, Long projectId, String query, Integer limit) {
        projectService.ensureProjectOwnership(email, projectId);

        String normalizedQuery = query == null ? "" : query.trim();
        String likeQuery = "%" + normalizedQuery + "%";
        int resolvedLimit = Math.max(1, Math.min(limit == null ? DEFAULT_LIMIT : limit, MAX_LIMIT));

        return jdbcTemplate.query("""
                SELECT
                    id::text AS id,
                    name,
                    slug,
                    category,
                    public_url,
                    keywords,
                    tags
                FROM public.icon_library
                WHERE (
                    ? = ''
                    OR COALESCE(name, '') ILIKE ?
                    OR COALESCE(slug, '') ILIKE ?
                    OR COALESCE(category, '') ILIKE ?
                )
                ORDER BY COALESCE(name, slug) ASC
                LIMIT ?
                """, (rs, rowNum) -> mapRow(rs), normalizedQuery, likeQuery, likeQuery, likeQuery, resolvedLimit);
    }

    private ProjectIconLibraryItemDto mapRow(ResultSet resultSet) throws SQLException {
        return ProjectIconLibraryItemDto.builder()
                .id(resultSet.getString("id"))
                .name(resultSet.getString("name"))
                .slug(resultSet.getString("slug"))
                .category(resultSet.getString("category"))
                .publicUrl(normalizePublicUrl(resultSet.getString("public_url")))
                .keywords(readTextArray(resultSet, "keywords"))
                .tags(readTextArray(resultSet, "tags"))
                .build();
    }

    private String normalizePublicUrl(String publicUrl) {
        if (publicUrl == null || publicUrl.isBlank()) {
            return publicUrl;
        }

        return publicUrl.replace(LEGACY_BUCKET_SEGMENT, CURRENT_BUCKET_SEGMENT);
    }

    private List<String> readTextArray(ResultSet resultSet, String columnName) throws SQLException {
        Array sqlArray = resultSet.getArray(columnName);
        if (sqlArray == null) {
            return List.of();
        }

        Object value = sqlArray.getArray();
        if (!(value instanceof String[] items)) {
            return List.of();
        }

        return Arrays.stream(items)
                .filter(item -> item != null && !item.isBlank())
                .map(String::trim)
                .toList();
    }
}
