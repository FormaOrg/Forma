package tn.forma.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.forma.users.model.ProjectMediaType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMediaDto {
    private Long id;
    private Long projectId;
    private String fileName;
    private String fileUrl;
    private ProjectMediaType type;
    private long fileSize;
    private String uploadedAt;
}
