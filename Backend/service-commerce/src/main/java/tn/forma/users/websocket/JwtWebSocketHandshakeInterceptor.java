package tn.forma.users.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import tn.forma.users.security.UserDetailsServiceImpl;
import tn.forma.users.service.ActivityService;
import tn.forma.users.service.JwtService;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtWebSocketHandshakeInterceptor implements HandshakeInterceptor {

    public static final String USER_EMAIL_ATTRIBUTE = "userEmail";
    public static final String SESSION_ID_ATTRIBUTE = "sessionId";

    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;
    private final ActivityService activityService;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        String token = extractToken(request);
        if (token == null || token.isBlank()) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        try {
            if (!jwtService.isAccessToken(token)) {
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return false;
            }

            String email = jwtService.extractEmail(token);
            String sessionId = jwtService.extractSessionId(token);
            var userDetails = userDetailsService.loadUserByUsername(email);

            if (!jwtService.isTokenValid(token, userDetails) || !activityService.isSessionActive(sessionId)) {
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return false;
            }

            attributes.put(USER_EMAIL_ATTRIBUTE, email);
            attributes.put(SESSION_ID_ATTRIBUTE, sessionId);
            return true;
        } catch (Exception ex) {
            log.debug("Rejected websocket handshake: {}", ex.getMessage());
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception
    ) {
        // No-op
    }

    private String extractToken(ServerHttpRequest request) {
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            return null;
        }

        return servletRequest.getServletRequest().getParameter("token");
    }
}
