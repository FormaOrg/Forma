package tn.forma.users.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProjectStorefrontRequest {

    @Size(max = 160)
    private String storeName;

    @Size(max = 80)
    private String themeKey;

    @Size(max = 80)
    private String activePageKey;

    private JsonNode draftHomepage;
}
