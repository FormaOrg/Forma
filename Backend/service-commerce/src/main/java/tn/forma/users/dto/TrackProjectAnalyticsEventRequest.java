package tn.forma.users.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TrackProjectAnalyticsEventRequest {

    private String eventType;

    @Size(max = 255, message = "Page path must be 255 characters or fewer")
    private String pagePath;

    @Size(max = 160, message = "Page title must be 160 characters or fewer")
    private String pageTitle;

    @Size(max = 160, message = "Session id must be 160 characters or fewer")
    private String sessionId;

    private String sourceType;

    @Size(max = 1000, message = "Referrer must be 1000 characters or fewer")
    private String referrer;

    private String deviceType;

    private LocalDateTime occurredAt;
}
