package tn.forma.users.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProjectEditorPresenceWebSocketHandler extends TextWebSocketHandler {

    private final ProjectEditorPresenceRealtimeService projectEditorPresenceRealtimeService;
    private final ObjectMapper objectMapper;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String email = (String) session.getAttributes().get(JwtWebSocketHandshakeInterceptor.USER_EMAIL_ATTRIBUTE);
        String sessionId = (String) session.getAttributes().get(JwtWebSocketHandshakeInterceptor.SESSION_ID_ATTRIBUTE);

        if (email == null || sessionId == null) {
            return;
        }

        projectEditorPresenceRealtimeService.register(email, sessionId, session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            JsonNode payload = objectMapper.readTree(message.getPayload());
            String type = payload.path("type").asText("");
            long projectId = payload.path("projectId").asLong(0L);
            if (projectId <= 0) {
                return;
            }

            if ("join_project_editor".equals(type)) {
                projectEditorPresenceRealtimeService.joinProject(session, projectId);
            } else if ("leave_project_editor".equals(type)) {
                projectEditorPresenceRealtimeService.leaveProject(session, projectId);
            } else if ("project_editor_cursor".equals(type) || "project_storefront_updated".equals(type)) {
                projectEditorPresenceRealtimeService.broadcastToOthers(session, projectId, payload);
            }
        } catch (Exception ex) {
            log.debug("Ignoring malformed project editor socket payload: {}", ex.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        projectEditorPresenceRealtimeService.unregister(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        projectEditorPresenceRealtimeService.unregister(session);
    }
}
