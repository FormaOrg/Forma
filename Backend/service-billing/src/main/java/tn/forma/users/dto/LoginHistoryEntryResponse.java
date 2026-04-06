package tn.forma.users.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class LoginHistoryEntryResponse {
    String id;
    String timestamp;
    String deviceName;
    String deviceType;
    String browser;
    String os;
    String location;
    String ipAddress;
    String status;
    String failureReason;
}
