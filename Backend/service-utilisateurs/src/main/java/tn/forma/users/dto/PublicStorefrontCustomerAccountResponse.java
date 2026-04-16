package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PublicStorefrontCustomerAccountResponse {
    private String sessionToken;
    private String expiresAt;
    private PublicStorefrontCustomerProfileDto customer;
    private List<PublicStorefrontCustomerOrderDto> orders;
}
