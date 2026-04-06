package tn.forma.users.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class PublicCheckoutRequest {

    @NotBlank
    @Size(max = 120)
    private String firstName;

    @NotBlank
    @Size(max = 120)
    private String lastName;

    @NotBlank
    @Size(max = 40)
    private String phone;

    @Email
    @Size(max = 255)
    private String email;

    @NotBlank
    @Size(max = 255)
    private String address;

    @Size(max = 1000)
    private String notes;

    @Valid
    @NotEmpty
    private List<PublicCheckoutItemRequest> items = new ArrayList<>();
}
