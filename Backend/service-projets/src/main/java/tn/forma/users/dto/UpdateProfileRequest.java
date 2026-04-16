package tn.forma.users.dto;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 2, max = 50)
    private String firstName;

    @Size(min = 2, max = 50)
    private String lastName;

    @Size(max = 20)
    private String phone;

    @Size(min = 3, max = 50)
    private String username;

    @Size(max = 100)
    private String country;

    @Size(max = 255)
    @Pattern(
            regexp = "^(https?://)?[\\w.-]+(?:\\.[\\w.-]+)+(?:[/#?].*)?$",
            message = "Invalid website format"
    )
    private String website;
}
