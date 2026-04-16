package tn.forma.users.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ActivityRealtimeEvent {
    String type;
    String reason;
    String occurredAt;
}
