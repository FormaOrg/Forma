package tn.forma.users.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tn.forma.users.dto.AnalyticsRangePreset;
import tn.forma.users.dto.ProjectAnalyticsPageDto;
import tn.forma.users.service.ProjectAnalyticsService;

@RestController
@RequestMapping("/api/projects/{projectId}/analytics")
@RequiredArgsConstructor
public class ProjectAnalyticsController {

    private final ProjectAnalyticsService projectAnalyticsService;

    @GetMapping
    public ResponseEntity<ProjectAnalyticsPageDto> getAnalyticsPage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "LAST_30_DAYS") String range
    ) {
        return ResponseEntity.ok(projectAnalyticsService.getAnalyticsPage(
                userDetails.getUsername(),
                projectId,
                AnalyticsRangePreset.fromNullable(range)
        ));
    }
}
