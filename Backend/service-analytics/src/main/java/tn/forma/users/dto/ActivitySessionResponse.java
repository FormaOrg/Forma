package tn.forma.users.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ActivitySessionResponse {
    String id;
    String deviceName;
    String deviceType;
    String browser;
    String os;
    String location;
    String ipAddress;
    String lastActive;
    @JsonProperty("isCurrent")
    boolean isCurrent;
}
