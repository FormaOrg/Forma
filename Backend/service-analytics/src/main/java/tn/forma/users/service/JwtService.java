package tn.forma.users.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Base64;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${application.jwt.secret}")
    private String secretKey;

    @Value("${application.jwt.expiration}")
    private long accessTokenExpiration;

    @Value("${application.jwt.refresh-expiration}")
    private long refreshTokenExpiration;

    @Value("${application.jwt.remember-expiration}")
    private long rememberAccessTokenExpiration;

    @Value("${application.jwt.remember-refresh-expiration}")
    private long rememberRefreshTokenExpiration;

    @Value("${application.jwt.expiration}")
    private long loginVerificationTokenExpiration;

    @Value("${application.jwt.expiration}")
    private long sensitiveActionTokenExpiration;

    // ── Extract claims ─────────────────────────────────────

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Long extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("userId", Long.class));
    }

    public String extractSessionId(String token) {
        return extractClaim(token, claims -> claims.get("sessionId", String.class));
    }

    public String extractTokenType(String token) {
        return extractClaim(token, claims -> claims.get("type", String.class));
    }

    public boolean extractRememberMe(String token) {
        Boolean rememberMe = extractClaim(token, claims -> claims.get("rememberMe", Boolean.class));
        return Boolean.TRUE.equals(rememberMe);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    // ── Generate tokens ────────────────────────────────────

    public String generateAccessToken(UserDetails userDetails, Long userId) {
        return generateAccessToken(userDetails, userId, false, null);
    }

    public String generateAccessToken(UserDetails userDetails, Long userId, boolean rememberMe) {
        return generateAccessToken(userDetails, userId, rememberMe, null);
    }

    public String generateAccessToken(UserDetails userDetails, Long userId, boolean rememberMe, String sessionId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("type", "access");
        claims.put("rememberMe", rememberMe);
        if (sessionId != null) {
            claims.put("sessionId", sessionId);
        }
        long expiration = rememberMe ? rememberAccessTokenExpiration : accessTokenExpiration;
        return buildToken(claims, userDetails.getUsername(), expiration);
    }

    public String generateRefreshToken(UserDetails userDetails, Long userId) {
        return generateRefreshToken(userDetails, userId, false, null);
    }

    public String generateRefreshToken(UserDetails userDetails, Long userId, boolean rememberMe) {
        return generateRefreshToken(userDetails, userId, rememberMe, null);
    }

    public String generateRefreshToken(UserDetails userDetails, Long userId, boolean rememberMe, String sessionId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("type", "refresh");
        claims.put("rememberMe", rememberMe);
        if (sessionId != null) {
            claims.put("sessionId", sessionId);
        }
        long expiration = rememberMe ? rememberRefreshTokenExpiration : refreshTokenExpiration;
        return buildToken(claims, userDetails.getUsername(), expiration);
    }

    public String generateLoginVerificationToken(String email, Long userId, boolean rememberMe) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("type", "login_verification");
        claims.put("rememberMe", rememberMe);
        return buildToken(claims, email, loginVerificationTokenExpiration);
    }

    public String generateSensitiveActionToken(String email, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("type", "sensitive_action");
        return buildToken(claims, email, sensitiveActionTokenExpiration);
    }

    // ── Validate tokens ────────────────────────────────────

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String email = extractEmail(token);
        return email.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    public boolean isAccessToken(String token) {
        return "access".equals(extractTokenType(token));
    }

    public boolean isRefreshToken(String token) {
        return "refresh".equals(extractTokenType(token));
    }

    public boolean isLoginVerificationToken(String token) {
        return "login_verification".equals(extractTokenType(token));
    }

    public boolean isSensitiveActionToken(String token) {
        return "sensitive_action".equals(extractTokenType(token));
    }

    public boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    // ── Private helpers ────────────────────────────────────

    private String buildToken(Map<String, Object> claims, String subject, long expiration) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey())
                .compact();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignInKey() {
        return Keys.hmacShaKeyFor(resolveSecretKeyBytes());
    }

    private byte[] resolveSecretKeyBytes() {
        String configuredSecret = secretKey == null ? "" : secretKey.trim();
        if (configuredSecret.isEmpty()) {
            throw new IllegalStateException("JWT secret is not configured");
        }

        if (configuredSecret.startsWith("raw:")) {
            return configuredSecret.substring("raw:".length()).getBytes(StandardCharsets.UTF_8);
        }

        if (configuredSecret.startsWith("base64:")) {
            return Decoders.BASE64.decode(configuredSecret.substring("base64:".length()));
        }

        if (configuredSecret.startsWith("base64url:")) {
            return Base64.getUrlDecoder().decode(configuredSecret.substring("base64url:".length()));
        }

        if (looksLikeLegacyBase64(configuredSecret)) {
            return Decoders.BASE64.decode(configuredSecret);
        }

        return configuredSecret.getBytes(StandardCharsets.UTF_8);
    }

    private boolean looksLikeLegacyBase64(String value) {
        return value.indexOf('=') >= 0 || value.indexOf('+') >= 0 || value.indexOf('/') >= 0;
    }
}
