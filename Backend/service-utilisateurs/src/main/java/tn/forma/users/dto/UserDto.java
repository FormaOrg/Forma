package tn.forma.users.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String username;
    private String phone;
    private String country;
    private String website;
    private String preferredLanguage;
    private String role;
    private boolean isActive;
    private boolean emailVerified;
    private String createdAt;
    private String updatedAt;
}
