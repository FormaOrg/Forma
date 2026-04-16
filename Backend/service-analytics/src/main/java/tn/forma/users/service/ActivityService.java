package tn.forma.users.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import tn.forma.users.dto.ActivitySessionResponse;
import tn.forma.users.dto.LoginHistoryEntryResponse;
import tn.forma.users.dto.MessageResponse;
import tn.forma.users.model.LoginHistoryEntry;
import tn.forma.users.model.User;
import tn.forma.users.model.UserSession;
import tn.forma.users.repository.LoginHistoryEntryRepository;
import tn.forma.users.repository.UserSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import tn.forma.users.websocket.ActivityRealtimeService;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityService {

    private final UserSessionRepository userSessionRepository;
    private final LoginHistoryEntryRepository loginHistoryEntryRepository;
    private final ActivityRealtimeService activityRealtimeService;

    private final HttpClient geoHttpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();
    private final ConcurrentHashMap<String, String> locationCache = new ConcurrentHashMap<>();
    private static final Pattern JSON_STRING_FIELD_PATTERN = Pattern.compile("\"%s\"\\s*:\\s*\"([^\"]*)\"");

    @Transactional
    public String createAuthenticatedSession(User user, boolean rememberMe) {
        RequestMetadata metadata = resolveRequestMetadata();
        String sessionId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();

        userSessionRepository.save(UserSession.builder()
                .user(user)
                .sessionId(sessionId)
                .deviceType(metadata.deviceType())
                .deviceName(metadata.deviceName())
                .browser(metadata.browser())
                .operatingSystem(metadata.operatingSystem())
                .location(metadata.location())
                .ipAddress(metadata.ipAddress())
                .rememberMe(rememberMe)
                .lastActiveAt(now)
                .build());

        loginHistoryEntryRepository.save(LoginHistoryEntry.builder()
                .user(user)
                .attemptedEmail(user.getEmail())
                .deviceType(metadata.deviceType())
                .deviceName(metadata.deviceName())
                .browser(metadata.browser())
                .operatingSystem(metadata.operatingSystem())
                .location(metadata.location())
                .ipAddress(metadata.ipAddress())
                .status("success")
                .build());

        activityRealtimeService.publishRefresh(user.getEmail(), "session_created");
        return sessionId;
    }

    @Transactional
    public void recordFailedLogin(String email, String failureReason, User user) {
        RequestMetadata metadata = resolveRequestMetadata();

        loginHistoryEntryRepository.save(LoginHistoryEntry.builder()
                .user(user)
                .attemptedEmail(normalizeEmail(email))
                .deviceType(metadata.deviceType())
                .deviceName(metadata.deviceName())
                .browser(metadata.browser())
                .operatingSystem(metadata.operatingSystem())
                .location(metadata.location())
                .ipAddress(metadata.ipAddress())
                .status("failed")
                .failureReason(failureReason)
                .build());

        if (user != null) {
            activityRealtimeService.publishRefresh(user.getEmail(), "login_failed");
        }
    }

    @Transactional
    public void touchSession(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return;
        }

        userSessionRepository.findBySessionId(sessionId).ifPresent(session -> {
            if (!session.isRevoked()) {
                session.setLastActiveAt(LocalDateTime.now());
                userSessionRepository.save(session);
            }
        });
    }

    public boolean isSessionActive(String sessionId) {
        return sessionId == null || sessionId.isBlank() || userSessionRepository.existsBySessionIdAndRevokedFalse(sessionId);
    }

    public List<ActivitySessionResponse> getActiveSessions(User user, String currentSessionId) {
        String resolvedCurrentSessionId = resolveCurrentSessionId(user.getId(), currentSessionId);
        return userSessionRepository.findByUserIdAndRevokedFalseOrderByLastActiveAtDesc(user.getId())
                .stream()
                .map(session -> mapSession(session, resolvedCurrentSessionId))
                .toList();
    }

    public List<LoginHistoryEntryResponse> getLoginHistory(User user) {
        return loginHistoryEntryRepository.findTop100ByAttemptedEmailIgnoreCaseOrderByCreatedAtDesc(user.getEmail())
                .stream()
                .filter(entry -> "success".equalsIgnoreCase(entry.getStatus()))
                .map(this::mapLoginHistory)
                .toList();
    }

    @Transactional
    public MessageResponse signOutSession(User user, String sessionId, String currentSessionId) {
        UserSession session = userSessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        String resolvedCurrentSessionId = resolveCurrentSessionId(user.getId(), currentSessionId);

        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Session not found");
        }

        if (sessionId.equals(resolvedCurrentSessionId)) {
            throw new RuntimeException("You cannot sign out the current session from here");
        }

        revokeSession(session);
        activityRealtimeService.publishRefresh(user.getEmail(), "session_revoked");
        return new MessageResponse("Session signed out successfully");
    }

    @Transactional
    public MessageResponse signOutOtherSessions(User user, String currentSessionId) {
        List<UserSession> sessions = userSessionRepository.findByUserIdAndRevokedFalseOrderByLastActiveAtDesc(user.getId());
        String resolvedCurrentSessionId = resolveCurrentSessionId(user.getId(), currentSessionId);
        int revokedCount = 0;

        for (UserSession session : sessions) {
            if (resolvedCurrentSessionId != null && resolvedCurrentSessionId.equals(session.getSessionId())) {
                continue;
            }
            revokeSession(session);
            revokedCount++;
        }

        if (revokedCount > 0) {
            activityRealtimeService.publishRefresh(user.getEmail(), "sessions_revoked");
        }

        return new MessageResponse(revokedCount == 0
                ? "No other active sessions found"
                : "Signed out of other active sessions");
    }

    private void revokeSession(UserSession session) {
        session.setRevoked(true);
        session.setRevokedAt(LocalDateTime.now());
        userSessionRepository.save(session);
    }

    private ActivitySessionResponse mapSession(UserSession session, String currentSessionId) {
        return ActivitySessionResponse.builder()
                .id(session.getSessionId())
                .deviceName(session.getDeviceName())
                .deviceType(session.getDeviceType())
                .browser(session.getBrowser())
                .os(session.getOperatingSystem())
                .location(session.getLocation())
                .ipAddress(session.getIpAddress())
                .lastActive(session.getLastActiveAt().toString())
                .isCurrent(session.getSessionId().equals(currentSessionId))
                .build();
    }

    private String resolveCurrentSessionId(Long userId, String currentSessionId) {
        if (currentSessionId != null && !currentSessionId.isBlank()) {
            return userSessionRepository.findBySessionId(currentSessionId)
                    .filter(session -> !session.isRevoked() && session.getUser().getId().equals(userId))
                    .map(UserSession::getSessionId)
                    .orElseGet(() -> findMatchingActiveSessionId(userId).orElseGet(() -> findMostRecentActiveSessionId(userId)));
        }

        return findMatchingActiveSessionId(userId).orElseGet(() -> findMostRecentActiveSessionId(userId));
    }

    private String findMostRecentActiveSessionId(Long userId) {
        return userSessionRepository.findByUserIdAndRevokedFalseOrderByLastActiveAtDesc(userId)
                .stream()
                .findFirst()
                .map(UserSession::getSessionId)
                .orElse(null);
    }

    private Optional<String> findMatchingActiveSessionId(Long userId) {
        RequestMetadata metadata = resolveRequestMetadata();

        return userSessionRepository.findByUserIdAndRevokedFalseOrderByLastActiveAtDesc(userId)
                .stream()
                .filter(session -> matchesCurrentRequest(session, metadata))
                .map(UserSession::getSessionId)
                .findFirst();
    }

    private boolean matchesCurrentRequest(UserSession session, RequestMetadata metadata) {
        return safeEquals(session.getIpAddress(), metadata.ipAddress())
                && safeEquals(session.getBrowser(), metadata.browser())
                && safeEquals(session.getOperatingSystem(), metadata.operatingSystem())
                && safeEquals(session.getDeviceType(), metadata.deviceType());
    }

    private LoginHistoryEntryResponse mapLoginHistory(LoginHistoryEntry entry) {
        return LoginHistoryEntryResponse.builder()
                .id(String.valueOf(entry.getId()))
                .timestamp(entry.getCreatedAt().toString())
                .deviceName(entry.getDeviceName())
                .deviceType(entry.getDeviceType())
                .browser(entry.getBrowser())
                .os(entry.getOperatingSystem())
                .location(entry.getLocation())
                .ipAddress(entry.getIpAddress())
                .status(entry.getStatus())
                .failureReason(entry.getFailureReason())
                .build();
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private RequestMetadata resolveRequestMetadata() {
        HttpServletRequest request = currentRequest().orElse(null);
        String userAgent = request != null ? safe(request.getHeader("User-Agent")) : "";
        String ipAddress = resolveIpAddress(request);
        String deviceType = detectDeviceType(userAgent);
        String browser = detectBrowser(userAgent);
        String operatingSystem = detectOperatingSystem(userAgent);
        String deviceName = browser + " on " + operatingSystem;

        return new RequestMetadata(
                deviceType,
                deviceName,
                browser,
                operatingSystem,
                resolveLocation(ipAddress),
                ipAddress
        );
    }

    private Optional<HttpServletRequest> currentRequest() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs)) {
            return Optional.empty();
        }
        return Optional.ofNullable(attrs.getRequest());
    }

    private String resolveIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "Unknown";
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        String remoteAddr = safe(request.getRemoteAddr());
        if ("0:0:0:0:0:0:0:1".equals(remoteAddr)) {
            return "127.0.0.1";
        }
        return remoteAddr.isBlank() ? "Unknown" : remoteAddr;
    }

    private String resolveLocation(String ipAddress) {
        String normalized = ipAddress == null ? "" : ipAddress.trim();
        if (normalized.isBlank() || "Unknown".equalsIgnoreCase(normalized)) {
            return "Unknown location";
        }

        if (isLocalOrPrivateIp(normalized)) {
            return "Local network";
        }

        return locationCache.computeIfAbsent(normalized, this::lookupLocation);
    }

    private String detectDeviceType(String userAgent) {
        String normalized = userAgent.toLowerCase(Locale.ROOT);
        if (normalized.contains("ipad") || normalized.contains("tablet")) {
            return "Tablet";
        }
        if (normalized.contains("iphone") || normalized.contains("android") || normalized.contains("mobile")) {
            return "Mobile";
        }
        return "Desktop";
    }

    private String detectBrowser(String userAgent) {
        String normalized = userAgent.toLowerCase(Locale.ROOT);
        if (normalized.contains("edg/")) return "Edge";
        if (normalized.contains("firefox/")) return "Firefox";
        if (normalized.contains("chrome/") && !normalized.contains("edg/")) return "Chrome";
        if (normalized.contains("safari/") && !normalized.contains("chrome/")) return "Safari";
        return "Browser";
    }

    private String detectOperatingSystem(String userAgent) {
        String normalized = userAgent.toLowerCase(Locale.ROOT);
        if (normalized.contains("windows")) return "Windows";
        if (normalized.contains("iphone") || normalized.contains("ipad") || normalized.contains("ios")) return "iOS";
        if (normalized.contains("android")) return "Android";
        if (normalized.contains("mac os") || normalized.contains("macintosh")) return "macOS";
        if (normalized.contains("ubuntu")) return "Ubuntu";
        if (normalized.contains("linux")) return "Linux";
        return "Unknown OS";
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean safeEquals(String left, String right) {
        return safe(left).equalsIgnoreCase(safe(right));
    }

    private boolean isLocalOrPrivateIp(String ipAddress) {
        String normalized = safe(ipAddress).toLowerCase(Locale.ROOT);

        return normalized.startsWith("127.")
                || normalized.equals("::1")
                || normalized.equals("0:0:0:0:0:0:0:1")
                || normalized.startsWith("10.")
                || normalized.startsWith("192.168.")
                || normalized.startsWith("172.16.")
                || normalized.startsWith("172.17.")
                || normalized.startsWith("172.18.")
                || normalized.startsWith("172.19.")
                || normalized.startsWith("172.2")
                || normalized.startsWith("localhost");
    }

    private String lookupLocation(String ipAddress) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://ip-api.com/json/" + ipAddress + "?fields=status,city,country"))
                    .timeout(Duration.ofSeconds(3))
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = geoHttpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return "Unknown location";
            }

            String body = response.body();
            String status = extractJsonField(body, "status");
            if (!"success".equalsIgnoreCase(status)) {
                return "Unknown location";
            }

            String city = extractJsonField(body, "city");
            String country = extractJsonField(body, "country");

            if (!city.isBlank() && !country.isBlank()) {
                return city + ", " + country;
            }

            if (!country.isBlank()) {
                return country;
            }

            return "Unknown location";
        } catch (Exception exception) {
            log.debug("Failed to resolve geolocation for IP {}", ipAddress, exception);
            return "Unknown location";
        }
    }

    private String extractJsonField(String body, String fieldName) {
        if (body == null || body.isBlank() || fieldName == null || fieldName.isBlank()) {
            return "";
        }

        Pattern pattern = Pattern.compile(JSON_STRING_FIELD_PATTERN.pattern().formatted(Pattern.quote(fieldName)));
        Matcher matcher = pattern.matcher(body);
        if (!matcher.find()) {
            return "";
        }

        return safe(matcher.group(1));
    }

    private record RequestMetadata(
            String deviceType,
            String deviceName,
            String browser,
            String operatingSystem,
            String location,
            String ipAddress
    ) {}
}
