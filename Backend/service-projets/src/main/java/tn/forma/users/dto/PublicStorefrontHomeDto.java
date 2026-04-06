package tn.forma.users.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicStorefrontHomeDto {
    private Long projectId;
    private String storeName;
    private String themeKey;
    private JsonNode homepage;
    private List<PublicStorefrontProductDto> featuredProducts;
}
