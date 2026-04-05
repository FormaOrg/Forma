package tn.forma.users.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.forma.users.dto.TrackProjectAnalyticsEventRequest;
import tn.forma.users.service.ProjectAnalyticsTrackingService;

@RestController
@RequestMapping("/api/public/projects/{projectId}/analytics/events")
@RequiredArgsConstructor
public class PublicProjectAnalyticsController {

    private final ProjectAnalyticsTrackingService projectAnalyticsTrackingService;

    @PostMapping
    public ResponseEntity<Void> trackEvent(
            @PathVariable Long projectId,
            @Valid @RequestBody TrackProjectAnalyticsEventRequest request,
            HttpServletRequest httpServletRequest
    ) {
        projectAnalyticsTrackingService.trackEvent(projectId, request, httpServletRequest);
        return ResponseEntity.noContent().build();
    }
}
