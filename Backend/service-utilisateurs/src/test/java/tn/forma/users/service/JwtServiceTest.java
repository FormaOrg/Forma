package tn.forma.users.service;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    @Test
    void rawSecretWithUnderscoresStillBuildsAndParsesTokens() {
        JwtService jwtService = newJwtService("replace_with_a_long_random_secret_for_tests_123");

        String token = jwtService.generateAccessToken(
                new User("owner@forma.test", "password", List.of()),
                42L,
                true,
                "session-123"
        );

        assertThat(jwtService.extractEmail(token)).isEqualTo("owner@forma.test");
        assertThat(jwtService.extractUserId(token)).isEqualTo(42L);
        assertThat(jwtService.extractSessionId(token)).isEqualTo("session-123");
        assertThat(jwtService.extractRememberMe(token)).isTrue();
        assertThat(jwtService.isAccessToken(token)).isTrue();
    }

    @Test
    void legacyBase64SecretRemainsSupported() {
        byte[] keyBytes = new byte[32];
        for (int index = 0; index < keyBytes.length; index++) {
            keyBytes[index] = (byte) (index + 1);
        }

        JwtService jwtService = newJwtService(Base64.getEncoder().encodeToString(keyBytes));

        String token = jwtService.generateRefreshToken(
                new User("owner@forma.test", "password", List.of()),
                7L,
                false,
                "session-7"
        );

        assertThat(jwtService.extractEmail(token)).isEqualTo("owner@forma.test");
        assertThat(jwtService.extractUserId(token)).isEqualTo(7L);
        assertThat(jwtService.extractSessionId(token)).isEqualTo("session-7");
        assertThat(jwtService.isRefreshToken(token)).isTrue();
    }

    @Test
    void explicitBase64UrlSecretIsSupported() {
        byte[] keyBytes = new byte[32];
        for (int index = 0; index < keyBytes.length; index++) {
            keyBytes[index] = (byte) 0xff;
        }

        JwtService jwtService = newJwtService("base64url:" + Base64.getUrlEncoder().withoutPadding().encodeToString(keyBytes));

        String token = jwtService.generateLoginVerificationToken("owner@forma.test", 11L, true);

        assertThat(jwtService.extractEmail(token)).isEqualTo("owner@forma.test");
        assertThat(jwtService.extractUserId(token)).isEqualTo(11L);
        assertThat(jwtService.extractRememberMe(token)).isTrue();
        assertThat(jwtService.isLoginVerificationToken(token)).isTrue();
    }

    private JwtService newJwtService(String secret) {
        JwtService jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", secret);
        ReflectionTestUtils.setField(jwtService, "accessTokenExpiration", 60_000L);
        ReflectionTestUtils.setField(jwtService, "refreshTokenExpiration", 120_000L);
        ReflectionTestUtils.setField(jwtService, "rememberAccessTokenExpiration", 180_000L);
        ReflectionTestUtils.setField(jwtService, "rememberRefreshTokenExpiration", 240_000L);
        ReflectionTestUtils.setField(jwtService, "loginVerificationTokenExpiration", 300_000L);
        ReflectionTestUtils.setField(jwtService, "sensitiveActionTokenExpiration", 300_000L);
        return jwtService;
    }
}
