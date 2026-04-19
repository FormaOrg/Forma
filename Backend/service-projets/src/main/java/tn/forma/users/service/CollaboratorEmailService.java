package tn.forma.users.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class CollaboratorEmailService {

    private final JavaMailSender mailSender;

    @Value("${application.frontend-url}")
    private String frontendUrl;

    @Value("${application.mail.from:${spring.mail.username}}")
    private String fromEmail;

    @Value("${application.mail.from-name:Forma}")
    private String fromName;

    @Async
    public void sendCollaboratorInviteEmail(String toEmail, String inviterName, String projectName, String role, String invitationToken) {
        String appUrl = frontendUrl + "/accept-invitation?token=" + invitationToken + "&email=" + URLEncoder.encode(toEmail, StandardCharsets.UTF_8);
        String roleLabel = "EDITOR".equalsIgnoreCase(role) ? "Editor" : "Viewer";

        String html = """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                      <tr>
                        <td style="background:#1a1a2e;padding:32px 40px;text-align:center;">
                          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Forma</h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:40px;">
                          <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:20px;font-weight:600;">You've been invited to collaborate</h2>
                          <p style="color:#4a5568;font-size:16px;line-height:1.6;margin:0 0 24px;">
                            <strong>%s</strong> has invited you to collaborate on the project
                            <strong>%s</strong> as a <strong>%s</strong>.
                          </p>
                          <p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0 0 32px;">
                            Open the invitation link below to accept access and start collaborating in Forma.
                          </p>
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background:#6c63ff;border-radius:8px;">
                                <a href="%s" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">Open Forma</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:24px 40px;border-top:1px solid #e8ecf0;text-align:center;">
                          <p style="color:#a0aec0;font-size:13px;margin:0;">
                            If you didn't expect this invitation, you can safely ignore this email.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(inviterName, projectName, roleLabel, appUrl);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(String.format("%s <%s>", fromName, fromEmail));
            helper.setTo(toEmail);
            helper.setSubject(inviterName + " invited you to collaborate on " + projectName);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Collaborator invite email sent to {}", toEmail);
        } catch (MailException | MessagingException e) {
            log.error("Failed to send collaborator invite email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send collaborator invitation email", e);
        }
    }
}
