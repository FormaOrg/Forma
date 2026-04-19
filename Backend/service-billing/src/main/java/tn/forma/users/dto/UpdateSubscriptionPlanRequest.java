package tn.forma.users.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateSubscriptionPlanRequest {

    @NotBlank
    private String plan;
}
