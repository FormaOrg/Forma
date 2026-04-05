package tn.forma.users.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectStorefrontDto {
    private Long id;
    private Long projectId;
    private String storeName;
    private String storeStatus;
    private String themeKey;
    private String activePageKey;
    private JsonNode draftHomepage;
    private JsonNode publishedHomepage;
    private String publishedAt;
    private String createdAt;
    private String updatedAt;
}
