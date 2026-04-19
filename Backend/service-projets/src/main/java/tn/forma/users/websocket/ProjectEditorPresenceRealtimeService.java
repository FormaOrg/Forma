package tn.forma.users.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import tn.forma.users.model.CollaboratorStatus;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectCollaboratorRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectEditorPresenceRealtimeService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectCollaboratorRepository collaboratorRepository;
    private final ObjectMapper objectMapper;

    private final Map<String, ConnectionContext> connectionsBySocketId = new ConcurrentHashMap<>();
    private final Map<Long, Set<String>> socketIdsByProjectId = new ConcurrentHashMap<>();

    public void register(String email, String sessionId, WebSocketSession session) {
        connectionsBySocketId.put(session.getId(), new ConnectionContext(email, sessionId, session));
    }

    public void unregister(WebSocketSession session) {
        if (session == null) {
            return;
        }

        ConnectionContext context = connectionsBySocketId.remove(session.getId());
        if (context == null) {
            return;
        }

        Long projectId = context.activeProjectId();
        if (projectId != null) {
            removeSocketFromProject(projectId, session.getId());
            publishPresence(projectId);
        }
    }

    public void joinProject(WebSocketSession session, Long projectId) {
        if (session == null || projectId == null) {
            return;
        }

        ConnectionContext context = connectionsBySocketId.get(session.getId());
        if (context == null) {
            return;
        }

        User user = userRepository.findByEmailIgnoreCase(context.email()).orElse(null);
        if (user == null || !hasProjectAccess(projectId, user.getId())) {
            return;
        }

        Long previousProjectId = context.activeProjectId();
        if (previousProjectId != null && !Objects.equals(previousProjectId, projectId)) {
            removeSocketFromProject(previousProjectId, session.getId());
            publishPresence(previousProjectId);
        }

        context.setUserId(user.getId());
        context.setUserName(buildUserName(user));
        context.setAvatarUrl(user.getAvatarUrl());
        context.setActiveProjectId(projectId);
        socketIdsByProjectId.computeIfAbsent(projectId, ignored -> ConcurrentHashMap.newKeySet()).add(session.getId());
        publishPresence(projectId);
    }

    public void leaveProject(WebSocketSession session, Long projectId) {
        if (session == null || projectId == null) {
            return;
        }

        ConnectionContext context = connectionsBySocketId.get(session.getId());
        if (context == null || !Objects.equals(context.activeProjectId(), projectId)) {
            return;
        }

        context.setActiveProjectId(null);
        removeSocketFromProject(projectId, session.getId());
        publishPresence(projectId);
    }

    public void broadcastToOthers(WebSocketSession sender, Long projectId, JsonNode payload) {
        if (sender == null || projectId == null) {
            return;
        }

        ConnectionContext senderContext = connectionsBySocketId.get(sender.getId());
        if (senderContext == null || !Objects.equals(senderContext.activeProjectId(), projectId)) {
            return;
        }

        Set<String> socketIds = socketIdsByProjectId.get(projectId);
        if (socketIds == null || socketIds.isEmpty()) {
            return;
        }

        String payloadStr;
        try {
            payloadStr = objectMapper.writeValueAsString(payload);
        } catch (Exception ex) {
            log.debug("Could not serialize broadcast payload: {}", ex.getMessage());
            return;
        }

        TextMessage message = new TextMessage(payloadStr);
        for (String socketId : Set.copyOf(socketIds)) {
            if (socketId.equals(sender.getId())) {
                continue;
            }
            ConnectionContext context = connectionsBySocketId.get(socketId);
            if (context == null) {
                continue;
            }
            try {
                if (!context.session().isOpen()) {
                    unregister(context.session());
                    continue;
                }
                synchronized (context.session()) {
                    context.session().sendMessage(message);
                }
            } catch (IOException ex) {
                log.debug("Failed to broadcast to {}: {}", context.email(), ex.getMessage());
                unregister(context.session());
            }
        }
    }

    private boolean hasProjectAccess(Long projectId, Long userId) {
        return projectRepository.findByIdAndUserId(projectId, userId).isPresent()
                || collaboratorRepository.findByProjectIdAndUserIdAndStatus(projectId, userId, CollaboratorStatus.ACCEPTED).isPresent();
    }

    private void removeSocketFromProject(Long projectId, String socketId) {
        socketIdsByProjectId.computeIfPresent(projectId, (ignored, socketIds) -> {
            socketIds.remove(socketId);
            return socketIds.isEmpty() ? null : socketIds;
        });
    }

    private void publishPresence(Long projectId) {
        Set<String> socketIds = socketIdsByProjectId.get(projectId);
        if (socketIds == null || socketIds.isEmpty()) {
            return;
        }

        TextMessage message = buildPresenceMessage(projectId);
        for (String socketId : Set.copyOf(socketIds)) {
            ConnectionContext context = connectionsBySocketId.get(socketId);
            if (context == null) {
                removeSocketFromProject(projectId, socketId);
                continue;
            }

            try {
                if (!context.session().isOpen()) {
                    unregister(context.session());
                    continue;
                }

                synchronized (context.session()) {
                    context.session().sendMessage(message);
                }
            } catch (IOException ex) {
                log.debug("Failed to push editor presence to {}: {}", context.email(), ex.getMessage());
                unregister(context.session());
            }
        }
    }

    private TextMessage buildPresenceMessage(Long projectId) {
        String occurredAt = OffsetDateTime.now().toString();
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("type", "project_editor_presence");
        payload.put("projectId", projectId);
        payload.put("occurredAt", occurredAt);

        ArrayNode activeEditors = payload.putArray("activeEditors");
        Map<Long, ConnectionContext> uniqueEditors = new LinkedHashMap<>();
        for (String socketId : Set.copyOf(socketIdsByProjectId.getOrDefault(projectId, Set.of()))) {
            ConnectionContext context = connectionsBySocketId.get(socketId);
            if (context == null || context.userId() == null) {
                continue;
            }
            uniqueEditors.putIfAbsent(context.userId(), context);
        }

        for (ConnectionContext context : uniqueEditors.values()) {
            ObjectNode activeEditor = activeEditors.addObject();
            activeEditor.put("userId", context.userId());
            activeEditor.put("email", context.email());
            activeEditor.put("userName", context.userName() != null ? context.userName() : context.email());
            activeEditor.put("lastSeenAt", occurredAt);
            if (context.avatarUrl() != null && !context.avatarUrl().isBlank()) {
                activeEditor.put("avatarUrl", context.avatarUrl());
            } else {
                activeEditor.putNull("avatarUrl");
            }
        }

        return new TextMessage(payload.toString());
    }

    private String buildUserName(User user) {
        String firstName = user.getFirstName() != null ? user.getFirstName().trim() : "";
        String lastName = user.getLastName() != null ? user.getLastName().trim() : "";
        String fullName = (firstName + " " + lastName).trim();
        return !fullName.isEmpty() ? fullName : user.getEmail();
    }

    private static final class ConnectionContext {
        private final String email;
        private final String sessionId;
        private final WebSocketSession session;
        private volatile Long activeProjectId;
        private volatile Long userId;
        private volatile String userName;
        private volatile String avatarUrl;

        private ConnectionContext(String email, String sessionId, WebSocketSession session) {
            this.email = email;
            this.sessionId = sessionId;
            this.session = session;
        }

        private String email() {
            return email;
        }

        private WebSocketSession session() {
            return session;
        }

        private Long activeProjectId() {
            return activeProjectId;
        }

        private void setActiveProjectId(Long activeProjectId) {
            this.activeProjectId = activeProjectId;
        }

        private Long userId() {
            return userId;
        }

        private void setUserId(Long userId) {
            this.userId = userId;
        }

        private String userName() {
            return userName;
        }

        private void setUserName(String userName) {
            this.userName = userName;
        }

        private String avatarUrl() {
            return avatarUrl;
        }

        private void setAvatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
        }
    }
}
