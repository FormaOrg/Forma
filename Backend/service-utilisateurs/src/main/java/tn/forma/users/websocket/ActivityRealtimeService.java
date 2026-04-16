package tn.forma.users.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityRealtimeService {

    private final Map<String, ConnectionContext> connectionsBySocketId = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> socketIdsByUserEmail = new ConcurrentHashMap<>();

    public void register(String email, String sessionId, WebSocketSession session) {
        connectionsBySocketId.put(
                session.getId(),
                new ConnectionContext(email, sessionId, session)
        );
        socketIdsByUserEmail.computeIfAbsent(email, ignored -> ConcurrentHashMap.newKeySet())
                .add(session.getId());
        log.debug("Activity websocket connected for {}", email);
    }

    public void unregister(WebSocketSession session) {
        if (session == null) {
            return;
        }

        ConnectionContext context = connectionsBySocketId.remove(session.getId());
        if (context == null) {
            return;
        }

        socketIdsByUserEmail.computeIfPresent(context.email(), (email, socketIds) -> {
            socketIds.remove(session.getId());
            return socketIds.isEmpty() ? null : socketIds;
        });

        log.debug("Activity websocket disconnected for {}", context.email());
    }

    public void publishRefresh(String email, String reason) {
        Set<String> socketIds = socketIdsByUserEmail.get(email);
        if (socketIds == null || socketIds.isEmpty()) {
            return;
        }

        TextMessage message = buildRefreshMessage(reason);
        for (String socketId : Set.copyOf(socketIds)) {
            ConnectionContext context = connectionsBySocketId.get(socketId);
            if (context == null) {
                continue;
            }

            try {
                if (!context.session().isOpen()) {
                    unregister(context.session());
                    continue;
                }

                context.session().sendMessage(message);
            } catch (IOException ex) {
                log.debug("Failed to push activity refresh to {}: {}", context.email(), ex.getMessage());
                unregister(context.session());
            }
        }
    }

    private TextMessage buildRefreshMessage(String reason) {
        String occurredAt = OffsetDateTime.now().toString()
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
        String safeReason = reason == null
                ? ""
                : reason.replace("\\", "\\\\").replace("\"", "\\\"");

        return new TextMessage("""
                {"type":"activity_refresh","reason":"%s","occurredAt":"%s"}
                """.formatted(safeReason, occurredAt));
    }

    private record ConnectionContext(
            String email,
            String sessionId,
            WebSocketSession session
    ) {}
}
