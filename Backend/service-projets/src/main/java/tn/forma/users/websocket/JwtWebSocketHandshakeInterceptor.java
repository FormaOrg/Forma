package tn.forma.users.websocket;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import tn.forma.users.service.JwtService;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class JwtWebSocketHandshakeInterceptor implements HandshakeInterceptor {

    public static final String USER_EMAIL_ATTRIBUTE = "userEmail";
    public static final String SESSION_ID_ATTRIBUTE = "sessionId";

    private final JwtService jwtService;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        HttpServletRequest httpRequest = servletRequest.getServletRequest();
        String token = httpRequest.getParameter("token");
        if (token == null || token.isBlank()) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        try {
            if (!jwtService.isAccessToken(token) || jwtService.isTokenExpired(token)) {
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return false;
            }

            String email = jwtService.extractEmail(token);
            String sessionId = jwtService.extractSessionId(token);
            if (email == null || email.isBlank()) {
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return false;
            }

            attributes.put(USER_EMAIL_ATTRIBUTE, email);
            attributes.put(SESSION_ID_ATTRIBUTE, sessionId);
            return true;
        } catch (RuntimeException ex) {
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
        // No-op.
    }
}
