package tn.forma.users.dto;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePreferencesRequest {

    @Pattern(regexp = "en|fr", message = "Preferred language must be en or fr")
    private String preferredLanguage;
}
