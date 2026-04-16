package tn.forma.users.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import tn.forma.users.websocket.ActivityWebSocketHandler;
import tn.forma.users.websocket.JwtWebSocketHandshakeInterceptor;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final ActivityWebSocketHandler activityWebSocketHandler;
    private final JwtWebSocketHandshakeInterceptor jwtWebSocketHandshakeInterceptor;

    @Value("${application.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${application.allowed-origins:}")
    private String allowedOrigins;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(activityWebSocketHandler, "/ws/activity")
                .addInterceptors(jwtWebSocketHandshakeInterceptor)
                .setAllowedOrigins(resolveAllowedOrigins().toArray(String[]::new));
    }

    private List<String> resolveAllowedOrigins() {
        if (allowedOrigins == null || allowedOrigins.isBlank()) {
            return List.of(frontendUrl);
        }

        return Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .distinct()
                .toList();
    }
}
