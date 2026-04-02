package tn.forma.users.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
@RequiredArgsConstructor
public class ActivityWebSocketHandler extends TextWebSocketHandler {

    private final ActivityRealtimeService activityRealtimeService;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String email = (String) session.getAttributes().get(JwtWebSocketHandshakeInterceptor.USER_EMAIL_ATTRIBUTE);
        String sessionId = (String) session.getAttributes().get(JwtWebSocketHandshakeInterceptor.SESSION_ID_ATTRIBUTE);

        if (email == null || sessionId == null) {
            return;
        }

        activityRealtimeService.register(email, sessionId, session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // The server only pushes activity refresh events for now.
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        activityRealtimeService.unregister(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        activityRealtimeService.unregister(session);
    }
}
