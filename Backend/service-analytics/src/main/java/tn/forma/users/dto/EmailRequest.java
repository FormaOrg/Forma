package tn.forma.users.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class EmailRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
}