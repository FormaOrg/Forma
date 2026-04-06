package tn.forma.users.dto;

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
    private Object draftHomepage;
    private Object publishedHomepage;
    private Object editorSession;
    private String publishedAt;
    private String createdAt;
    private String updatedAt;
}
