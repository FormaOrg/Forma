package tn.forma.users.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GoogleLinkConfigResponse {
    private String clientId;
    private String redirectUri;
}
