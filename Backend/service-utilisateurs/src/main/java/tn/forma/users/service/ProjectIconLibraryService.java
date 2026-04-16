package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.ProjectIconLibraryItemDto;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectIconLibraryService {

    private final JdbcTemplate jdbcTemplate;
    private final ProjectService projectService;

    @Transactional(readOnly = true)
    public List<ProjectIconLibraryItemDto> searchProjectIcons(String email, Long projectId, String query, int limit) {
        projectService.ensureProjectOwnership(email, projectId);

        String normalizedQuery = query == null ? "" : query.trim();
        String likeQuery = "%" + normalizedQuery + "%";
        int sanitizedLimit = Math.max(1, Math.min(limit, 100));

        return jdbcTemplate.query("""
                SELECT id::text AS id, name, slug, category, public_url, keywords, tags
                FROM public.icon_library
                WHERE (
                    ? = ''
                    OR COALESCE(name, '') ILIKE ?
                    OR COALESCE(slug, '') ILIKE ?
                    OR COALESCE(category, '') ILIKE ?
                )
                ORDER BY COALESCE(name, slug) ASC
                LIMIT ?
                """,
                iconRowMapper(),
                normalizedQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                sanitizedLimit);
    }

    private RowMapper<ProjectIconLibraryItemDto> iconRowMapper() {
        return (rs, rowNum) -> ProjectIconLibraryItemDto.builder()
                .id(rs.getString("id"))
                .name(rs.getString("name"))
                .slug(rs.getString("slug"))
                .category(rs.getString("category"))
                .publicUrl(rs.getString("public_url"))
                .keywords(readStringArray(rs, "keywords"))
                .tags(readStringArray(rs, "tags"))
                .build();
    }

    private List<String> readStringArray(ResultSet rs, String columnName) throws SQLException {
        Array sqlArray = rs.getArray(columnName);
        if (sqlArray == null) {
            return Collections.emptyList();
        }

        Object arrayValue = sqlArray.getArray();
        if (arrayValue instanceof String[] values) {
            return Arrays.asList(values);
        }

        if (arrayValue instanceof Object[] values) {
            return Arrays.stream(values)
                    .map(value -> value == null ? null : value.toString())
                    .toList();
        }

        return Collections.emptyList();
    }
}
