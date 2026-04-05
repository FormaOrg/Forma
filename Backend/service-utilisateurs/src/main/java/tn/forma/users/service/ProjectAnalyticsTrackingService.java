package tn.forma.users.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.TrackProjectAnalyticsEventRequest;
import tn.forma.users.model.*;
import tn.forma.users.repository.ProjectAnalyticsEventRepository;
import tn.forma.users.repository.ProjectRepository;

import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectAnalyticsTrackingService {

    private final ProjectRepository projectRepository;
    private final ProjectAnalyticsEventRepository projectAnalyticsEventRepository;

    public void trackEvent(Long projectId, TrackProjectAnalyticsEventRequest request, HttpServletRequest httpServletRequest) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        String userAgent = Optional.ofNullable(httpServletRequest.getHeader("User-Agent")).orElse("");
        String referrer = normalizeText(request.getReferrer(), 1000);
        String remoteAddress = Optional.ofNullable(httpServletRequest.getRemoteAddr()).orElse("unknown");

        ProjectAnalyticsEvent event = ProjectAnalyticsEvent.builder()
                .project(project)
                .eventType(ProjectAnalyticsEventType.fromNullable(request.getEventType()))
                .pagePath(normalizePath(request.getPagePath()))
                .pageTitle(normalizeText(request.getPageTitle(), 160))
                .visitorKey(resolveVisitorKey(request.getSessionId(), remoteAddress, userAgent))
                .sourceType(resolveSourceType(request.getSourceType(), referrer))
                .referrerHost(extractHost(referrer))
                .deviceType(resolveDeviceType(request.getDeviceType(), userAgent))
                .occurredAt(Optional.ofNullable(request.getOccurredAt()).orElse(LocalDateTime.now()))
                .build();

        projectAnalyticsEventRepository.save(event);
    }

    private String resolveVisitorKey(String sessionId, String remoteAddress, String userAgent) {
        String normalizedSession = normalizeText(sessionId, 160);
        if (normalizedSession != null && !normalizedSession.isBlank()) {
            return normalizedSession;
        }

        String raw = remoteAddress + "|" + userAgent;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException exception) {
            return Integer.toHexString(raw.hashCode());
        }
    }

    private ProjectAnalyticsSourceType resolveSourceType(String explicitSource, String referrer) {
        if (explicitSource != null && !explicitSource.isBlank()) {
            return ProjectAnalyticsSourceType.fromNullable(explicitSource);
        }

        String host = extractHost(referrer);
        if (host == null || host.isBlank()) {
            return ProjectAnalyticsSourceType.DIRECT;
        }

        String normalized = host.toLowerCase(Locale.ROOT);
        if (normalized.contains("google.") || normalized.contains("bing.") || normalized.contains("yahoo.") || normalized.contains("duckduckgo.")) {
            return ProjectAnalyticsSourceType.SEARCH;
        }

        if (normalized.contains("facebook.")
                || normalized.contains("instagram.")
                || normalized.contains("tiktok.")
                || normalized.contains("x.com")
                || normalized.contains("twitter.")
                || normalized.contains("linkedin.")
                || normalized.contains("pinterest.")
                || normalized.contains("youtube.")) {
            return ProjectAnalyticsSourceType.SOCIAL;
        }

        return ProjectAnalyticsSourceType.REFERRAL;
    }

    private ProjectAnalyticsDeviceType resolveDeviceType(String explicitDevice, String userAgent) {
        if (explicitDevice != null && !explicitDevice.isBlank()) {
            return ProjectAnalyticsDeviceType.fromNullable(explicitDevice);
        }

        String normalized = Optional.ofNullable(userAgent).orElse("").toLowerCase(Locale.ROOT);
        if (normalized.contains("ipad") || normalized.contains("tablet")) {
            return ProjectAnalyticsDeviceType.TABLET;
        }

        if (normalized.contains("mobile") || normalized.contains("iphone") || normalized.contains("android")) {
            return ProjectAnalyticsDeviceType.MOBILE;
        }

        if (normalized.isBlank()) {
            return ProjectAnalyticsDeviceType.OTHER;
        }

        return ProjectAnalyticsDeviceType.DESKTOP;
    }

    private String extractHost(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return null;
        }

        try {
            URI uri = new URI(rawUrl.trim());
            return uri.getHost();
        } catch (URISyntaxException exception) {
            return null;
        }
    }

    private String normalizePath(String value) {
        String normalized = normalizeText(value, 255);
        if (normalized == null || normalized.isBlank()) {
            return "/";
        }
        return normalized;
    }

    private String normalizeText(String value, int maxLength) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }
}
