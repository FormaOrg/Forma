package tn.forma.users.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import tn.forma.users.dto.GoogleLinkConfigResponse;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleLinkOauthService {

    private static final URI TOKEN_URI = URI.create("https://oauth2.googleapis.com/token");
    private static final Pattern ID_TOKEN_PATTERN = Pattern.compile("\"id_token\"\\s*:\\s*\"([^\"]+)\"");
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${application.google.link-client-id:}")
    private String linkClientId;

    @Value("${application.google.link-client-secret:}")
    private String linkClientSecret;

    @Value("${application.google.link-redirect-uri:}")
    private String linkRedirectUri;

    public GoogleLinkConfigResponse getConfig() {
        if (linkClientId == null || linkClientId.isBlank() || linkRedirectUri == null || linkRedirectUri.isBlank()) {
            throw new RuntimeException("Google account linking is not configured");
        }

        return new GoogleLinkConfigResponse(linkClientId, linkRedirectUri);
    }

    public GoogleIdToken.Payload exchangeCodeForPayload(String code, String redirectUri) {
        GoogleLinkConfigResponse config = getConfig();

        if (!normalizeRedirectUri(config.getRedirectUri()).equals(normalizeRedirectUri(redirectUri))) {
            throw new RuntimeException("Invalid Google redirect URI");
        }

        if (linkClientSecret == null || linkClientSecret.isBlank()) {
            throw new RuntimeException("Google account linking is not configured");
        }

        try {
            String form = buildFormBody(code, redirectUri, config.getClientId(), linkClientSecret);

            HttpRequest request = HttpRequest.newBuilder(TOKEN_URI)
                    .header("Content-Type", MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                    .POST(HttpRequest.BodyPublishers.ofString(form))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                log.warn("Google token exchange failed: status={}, body={}", response.statusCode(), response.body());
                throw new RuntimeException("Google account linking failed. Please try again.");
            }

            String idToken = extractIdToken(response.body());
            if (idToken == null || idToken.isBlank()) {
                throw new RuntimeException("Google account linking failed. Please try again.");
            }

            return verifyIdToken(idToken, config.getClientId());
        } catch (RuntimeException ex) {
            throw ex;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.error("Google OAuth code exchange interrupted", ex);
            throw new RuntimeException("Google account linking failed. Please try again.");
        } catch (IOException ex) {
            log.error("Google OAuth code exchange failed", ex);
            throw new RuntimeException("Google account linking failed. Please try again.");
        }
    }

    private GoogleIdToken.Payload verifyIdToken(String idToken, String expectedClientId) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            )
                    .setAudience(Collections.singletonList(expectedClientId))
                    .build();

            GoogleIdToken googleIdToken = verifier.verify(idToken);
            if (googleIdToken == null) {
                throw new RuntimeException("Invalid Google account token");
            }

            return googleIdToken.getPayload();
        } catch (RuntimeException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Google ID token verification failed", ex);
            throw new RuntimeException("Google account linking failed. Please try again.");
        }
    }

    private String buildFormBody(String code, String redirectUri, String clientId, String clientSecret) {
        return "code=" + encode(code)
                + "&client_id=" + encode(clientId)
                + "&client_secret=" + encode(clientSecret)
                + "&redirect_uri=" + encode(redirectUri)
                + "&grant_type=authorization_code";
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String extractIdToken(String responseBody) {
        Matcher matcher = ID_TOKEN_PATTERN.matcher(responseBody);
        return matcher.find() ? matcher.group(1) : null;
    }

    private String normalizeRedirectUri(String redirectUri) {
        if (redirectUri == null) {
            return "";
        }

        return redirectUri.endsWith("/") ? redirectUri.substring(0, redirectUri.length() - 1) : redirectUri;
    }
}
