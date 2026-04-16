package tn.forma.users.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${application.frontend-url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // ── Verification email ─────────────────────────────────

    @Async
    public void sendVerificationEmail(String toEmail, String firstName, String token) {
        String verificationUrl = frontendUrl + "/verify-email?token=" + token;

        String html = """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">

              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">

                    <!-- HEADER -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#0e2233 0%%,#0c2e2a 60%%,#0a3028 100%%);
                                 border-radius:16px 16px 0 0;padding:36px 40px;text-align:left;">
                        <table width="100%%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                                Forma
                              </span>
                              <br>
                              <span style="font-size:12px;color:rgba(255,255,255,0.45);letter-spacing:2px;text-transform:uppercase;">
                              </span>
                            </td>
                            <td align="right">
                              <!-- envelope icon via unicode -->
                              <span style="font-size:28px;color:rgba(0,190,150,0.7);">✉</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- BODY -->
                    <tr>
                      <td style="background:#ffffff;padding:40px 40px 32px;">

                        <!-- greeting -->
                        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">
                          Email Verification
                        </p>
                        <h1 style="margin:0 0 20px;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;line-height:1.2;">
                          Hi %s, confirm your email
                        </h1>
                        <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
                          Thanks for signing up! Click the button below to verify your email address
                          and activate your Forma account.
                        </p>

                        <!-- CTA button -->
                        <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                          <tr>
                            <td style="background:#0f172a;border-radius:8px;">
                              <a href="%s"
                                 style="display:inline-block;padding:14px 32px;font-size:15px;
                                        font-weight:600;color:#ffffff;text-decoration:none;
                                        letter-spacing:0.2px;">
                                Verify my email &rarr;
                              </a>
                            </td>
                          </tr>
                        </table>

                        <!-- divider -->
                        <hr style="border:none;border-top:1px solid #e8edf2;margin:0 0 24px;">

                        <!-- fallback link -->
                        <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;">
                          Button not working? Copy and paste this link into your browser:
                        </p>
                        <p style="margin:0;font-size:12px;color:#0f172a;word-break:break-all;">
                          %s
                        </p>

                      </td>
                    </tr>

                    <!-- NOTICE BOX -->
                    <tr>
                      <td style="background:#f7f9fc;padding:20px 40px;border-left:4px solid #e2e8f0;">
                        <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                          ⏱ This link expires in <strong style="color:#0f172a;">24 hours</strong>.<br>
                          If you didn't create an account, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                      <td style="background:#0f172a;border-radius:0 0 16px 16px;padding:24px 40px;">
                        <table width="100%%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <span style="font-size:13px;color:rgba(255,255,255,0.5);">
                                © 2025 Forma — Tunisia
                              </span>
                            </td>
                            <td align="right">
                              <span style="font-size:12px;color:rgba(255,255,255,0.3);">
                                Web Creation Platform
                              </span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>

            </body>
            </html>
            """.formatted(firstName, verificationUrl, verificationUrl);

        sendHtmlEmail(toEmail, "Verify your Forma account", html);
    }

    // ── Password reset email ───────────────────────────────

    @Async
    public void sendPasswordResetEmail(String toEmail, String firstName, String token) {
        String resetUrl = frontendUrl + "/reset-password?token=" + token;

        String html = """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">

              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">

                    <!-- HEADER -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#0e2233 0%%,#0c2e2a 60%%,#0a3028 100%%);
                                 border-radius:16px 16px 0 0;padding:36px 40px;text-align:left;">
                        <table width="100%%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                                Forma
                              </span>
                              <br>
                              <span style="font-size:12px;color:rgba(255,255,255,0.45);letter-spacing:2px;text-transform:uppercase;">
                              </span>
                            </td>
                            <td align="right">
                              <span style="font-size:28px;color:rgba(0,190,150,0.7);">🔒</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- BODY -->
                    <tr>
                      <td style="background:#ffffff;padding:40px 40px 32px;">

                        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">
                          Password Reset
                        </p>
                        <h1 style="margin:0 0 20px;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;line-height:1.2;">
                          Reset your password, %s
                        </h1>
                        <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
                          We received a request to reset the password for your account.
                          Click the button below to choose a new password.
                        </p>

                        <!-- CTA button -->
                        <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                          <tr>
                            <td style="background:#0f172a;border-radius:8px;">
                              <a href="%s"
                                 style="display:inline-block;padding:14px 32px;font-size:15px;
                                        font-weight:600;color:#ffffff;text-decoration:none;
                                        letter-spacing:0.2px;">
                                Reset password &rarr;
                              </a>
                            </td>
                          </tr>
                        </table>

                        <!-- divider -->
                        <hr style="border:none;border-top:1px solid #e8edf2;margin:0 0 24px;">

                        <!-- fallback link -->
                        <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;">
                          Button not working? Copy and paste this link into your browser:
                        </p>
                        <p style="margin:0;font-size:12px;color:#0f172a;word-break:break-all;">
                          %s
                        </p>

                      </td>
                    </tr>

                    <!-- NOTICE BOX -->
                    <tr>
                      <td style="background:#f7f9fc;padding:20px 40px;border-left:4px solid #e2e8f0;">
                        <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                          ⏱ This link expires in <strong style="color:#0f172a;">1 hour</strong>.<br>
                          If you didn't request a password reset, ignore this email — your account is safe.
                        </p>
                      </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                      <td style="background:#0f172a;border-radius:0 0 16px 16px;padding:24px 40px;">
                        <table width="100%%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <span style="font-size:13px;color:rgba(255,255,255,0.5);">
                                © 2025 Forma — Tunisia
                              </span>
                            </td>
                            <td align="right">
                              <span style="font-size:12px;color:rgba(255,255,255,0.3);">
                                Web Creation Platform
                              </span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>

            </body>
            </html>
            """.formatted(firstName, resetUrl, resetUrl);

        sendHtmlEmail(toEmail, "Reset your Forma password", html);
    }

    @Async
    public void sendEmailChangeCode(String toEmail, String firstName, String code) {
        String html = """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">
                    <tr>
                      <td style="background:linear-gradient(135deg,#0e2233 0%%,#0c2e2a 60%%,#0a3028 100%%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:left;">
                        <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Forma</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#ffffff;padding:40px 40px 32px;">
                        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">
                          Email Change
                        </p>
                        <h1 style="margin:0 0 18px;font-size:26px;font-weight:800;color:#0f172a;line-height:1.2;">
                          Confirm your new email, %s
                        </h1>
                        <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">
                          Enter the verification code below in FORMA to finish updating your account email.
                        </p>
                        <div style="display:inline-block;padding:14px 24px;border-radius:12px;background:#0f172a;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:8px;">
                          %s
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#f7f9fc;padding:20px 40px;border-left:4px solid #e2e8f0;">
                        <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                          ⏱ This code expires in <strong style="color:#0f172a;">15 minutes</strong>.<br>
                          Requested at %s.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#0f172a;border-radius:0 0 16px 16px;padding:24px 40px;">
                        <span style="font-size:13px;color:rgba(255,255,255,0.5);">© 2025 Forma — Tunisia</span>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(firstName, code, LocalDateTime.now());

        sendHtmlEmail(toEmail, "Confirm your new Forma email", html);
    }

    @Async
    public void sendLoginVerificationCode(String toEmail, String firstName, String code, boolean enable) {
        String actionLabel = enable ? "enable" : "disable";
        String html = """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">
                    <tr>
                      <td style="background:linear-gradient(135deg,#0e2233 0%%,#0c2e2a 60%%,#0a3028 100%%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:left;">
                        <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Forma</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#ffffff;padding:40px 40px 32px;">
                        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">
                          2-Step Verification
                        </p>
                        <h1 style="margin:0 0 18px;font-size:26px;font-weight:800;color:#0f172a;line-height:1.2;">
                          Confirm this security change, %s
                        </h1>
                        <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">
                          Use the code below in FORMA to %s email verification for new logins.
                        </p>
                        <div style="display:inline-block;padding:14px 24px;border-radius:12px;background:#0f172a;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:8px;">
                          %s
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#f7f9fc;padding:20px 40px;border-left:4px solid #e2e8f0;">
                        <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                          ⏱ This code expires in <strong style="color:#0f172a;">15 minutes</strong>.<br>
                          Requested at %s.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#0f172a;border-radius:0 0 16px 16px;padding:24px 40px;">
                        <span style="font-size:13px;color:rgba(255,255,255,0.5);">© 2025 Forma — Tunisia</span>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(firstName, actionLabel, code, LocalDateTime.now());

        sendHtmlEmail(toEmail, "Confirm your Forma security change", html);
    }

    @Async
    public void sendLoginAccessCode(String toEmail, String firstName, String code) {
        String html = """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">
                    <tr>
                      <td style="background:linear-gradient(135deg,#0e2233 0%%,#0c2e2a 60%%,#0a3028 100%%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:left;">
                        <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Forma</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#ffffff;padding:40px 40px 32px;">
                        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">
                          Login Verification
                        </p>
                        <h1 style="margin:0 0 18px;font-size:26px;font-weight:800;color:#0f172a;line-height:1.2;">
                          One more step, %s
                        </h1>
                        <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">
                          Enter this code in FORMA to finish signing in to your account.
                        </p>
                        <div style="display:inline-block;padding:14px 24px;border-radius:12px;background:#0f172a;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:8px;">
                          %s
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#f7f9fc;padding:20px 40px;border-left:4px solid #e2e8f0;">
                        <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                          ⏱ This code expires in <strong style="color:#0f172a;">15 minutes</strong>.<br>
                          Requested at %s.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#0f172a;border-radius:0 0 16px 16px;padding:24px 40px;">
                        <span style="font-size:13px;color:rgba(255,255,255,0.5);">© 2025 Forma — Tunisia</span>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(firstName, code, LocalDateTime.now());

        sendHtmlEmail(toEmail, "Your Forma login verification code", html);
    }

    // ── Private helper ─────────────────────────────────────

    private void sendHtmlEmail(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email sent to {}: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
