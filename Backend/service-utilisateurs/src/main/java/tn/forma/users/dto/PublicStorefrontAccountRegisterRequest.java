package tn.forma.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class PublicStorefrontAccountRegisterRequest {

    @NotBlank
    @Size(max = 120)
    private String firstName;

    @NotBlank
    @Size(max = 120)
    private String lastName;

    @Email
    @NotBlank
    @Size(max = 255)
    private String email;

    @Size(max = 40)
    private String phone;

    @Size(max = 255)
    private String address;

    @NotBlank
    @Size(min = 8, max = 120)
    private String password;
}
