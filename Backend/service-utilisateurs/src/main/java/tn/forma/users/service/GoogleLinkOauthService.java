package tn.forma.users.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import tn.forma.users.dto.GoogleLinkConfigResponse;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
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

    @Value("${application.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${application.allowed-origins:}")
    private String allowedOrigins;

    public GoogleLinkConfigResponse getConfig(HttpServletRequest request) {
        if (linkClientId == null || linkClientId.isBlank()) {
            throw new RuntimeException("Google account linking is not configured");
        }

        return new GoogleLinkConfigResponse(linkClientId, resolveRedirectUri(request));
    }

    public GoogleIdToken.Payload exchangeCodeForPayload(String code, String redirectUri) {
        String registeredRedirectUri = resolveRegisteredRedirectUri(redirectUri);

        if (registeredRedirectUri == null) {
            throw new RuntimeException("Invalid Google redirect URI");
        }

        if (linkClientSecret == null || linkClientSecret.isBlank()) {
            throw new RuntimeException("Google account linking is not configured");
        }

        try {
            String form = buildFormBody(code, registeredRedirectUri, linkClientId, linkClientSecret);

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

            return verifyIdToken(idToken, linkClientId);
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

        String normalized = redirectUri.trim();
        return normalized.endsWith("/") ? normalized.substring(0, normalized.length() - 1) : normalized;
    }

    private String resolveRedirectUri(HttpServletRequest request) {
        String requestedOrigin = resolveRequestOrigin(request);
        if (requestedOrigin != null) {
            return buildCanonicalRedirectUri(requestedOrigin);
        }

        String normalizedFrontendUrl = normalizeRedirectUri(frontendUrl);
        return normalizedFrontendUrl + "/google-oauth-popup.html";
    }

    private String resolveRegisteredRedirectUri(String redirectUri) {
        String normalizedIncoming = normalizeRedirectUri(redirectUri);
        for (String candidateOrigin : getAllowedOriginsInPriorityOrder()) {
            String canonicalRedirectUri = buildCanonicalRedirectUri(candidateOrigin);
            if (matchesRedirectCandidate(normalizedIncoming, canonicalRedirectUri)) {
                return canonicalRedirectUri;
            }
        }

        return null;
    }

    private boolean matchesRedirectCandidate(String incomingRedirectUri, String canonicalRedirectUri) {
        String normalizedCanonical = normalizeRedirectUri(canonicalRedirectUri);
        if (Objects.equals(incomingRedirectUri, normalizedCanonical)) {
            return true;
        }

        String popupWithoutHtml = normalizedCanonical.replace("/google-oauth-popup.html", "/google-oauth-popup");
        return Objects.equals(incomingRedirectUri, popupWithoutHtml);
    }

    private String buildCanonicalRedirectUri(String origin) {
        return normalizeRedirectUri(origin) + "/google-oauth-popup.html";
    }

    private String resolveRequestOrigin(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String originHeader = normalizeOrigin(request.getHeader("Origin"));
        if (originHeader != null && isConfiguredOrigin(originHeader)) {
            return originHeader;
        }

        String refererOrigin = extractOrigin(request.getHeader("Referer"));
        if (refererOrigin != null && isConfiguredOrigin(refererOrigin)) {
            return refererOrigin;
        }

        return null;
    }

    private boolean isConfiguredOrigin(String origin) {
        return getAllowedOriginsInPriorityOrder().stream()
                .map(this::normalizeOrigin)
                .filter(Objects::nonNull)
                .anyMatch(origin::equals);
    }

    private List<String> getAllowedOriginsInPriorityOrder() {
        LinkedHashSet<String> origins = new LinkedHashSet<>();

        if (linkRedirectUri != null && !linkRedirectUri.isBlank()) {
            String configuredOrigin = extractOrigin(linkRedirectUri);
            if (configuredOrigin != null) {
                origins.add(configuredOrigin);
            }
        }

        String normalizedFrontendUrl = normalizeOrigin(frontendUrl);
        if (normalizedFrontendUrl != null) {
            origins.add(normalizedFrontendUrl);
        }

        if (allowedOrigins != null && !allowedOrigins.isBlank()) {
            Arrays.stream(allowedOrigins.split(","))
                    .map(this::normalizeOrigin)
                    .filter(Objects::nonNull)
                    .forEach(origins::add);
        }

        return new ArrayList<>(origins);
    }

    private String normalizeOrigin(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            URI uri = new URI(normalizeRedirectUri(value));
            String scheme = Optional.ofNullable(uri.getScheme()).map(String::toLowerCase).orElse(null);
            String host = Optional.ofNullable(uri.getHost()).map(String::toLowerCase).orElse(null);
            if (scheme == null || host == null) {
                return null;
            }

            int port = uri.getPort();
            if (port == -1 || ("https".equals(scheme) && port == 443) || ("http".equals(scheme) && port == 80)) {
                return scheme + "://" + host;
            }

            return scheme + "://" + host + ":" + port;
        } catch (URISyntaxException ex) {
            return null;
        }
    }

    private String extractOrigin(String value) {
        return normalizeOrigin(value);
    }
}
