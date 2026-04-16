package tn.forma.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectIconLibraryItemDto {
    private String id;
    private String name;
    private String slug;
    private String category;
    private String publicUrl;
    private List<String> keywords;
    private List<String> tags;
}
