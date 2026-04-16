package tn.forma.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class UpdateProjectCustomerRequest {

    @Size(max = 120)
    private String firstName;

    @Size(max = 120)
    private String lastName;

    @Email
    @Size(max = 255)
    private String email;

    @Size(max = 40)
    private String phone;

    @Size(max = 255)
    private String address;

    @Size(max = 120)
    private String zoneLabel;
}
