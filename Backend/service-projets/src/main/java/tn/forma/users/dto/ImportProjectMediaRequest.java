package tn.forma.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ImportProjectMediaRequest {

    @NotBlank
    @Size(max = 1024)
    private String sourceUrl;

    @Size(max = 255)
    private String fileName;
}
