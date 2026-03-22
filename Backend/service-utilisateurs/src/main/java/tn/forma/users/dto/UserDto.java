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
    private String role;
    private boolean emailVerified;
}