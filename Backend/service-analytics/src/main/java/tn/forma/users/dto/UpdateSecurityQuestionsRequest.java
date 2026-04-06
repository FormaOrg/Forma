package tn.forma.users.dto;

import lombok.Data;

@Data
public class UpdateSecurityQuestionsRequest {
    private String currentPassword;

    private String verificationToken;

    private String question1;

    private String answer1;

    private String question2;

    private String answer2;
}
