package tn.forma.users.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.forma.users.dto.ProjectHomePageDto;
import tn.forma.users.service.ProjectHomeService;

@RestController
@RequestMapping("/api/projects/{projectId}/home")
@RequiredArgsConstructor
public class ProjectHomeController {

    private final ProjectHomeService projectHomeService;

    @GetMapping
    public ResponseEntity<ProjectHomePageDto> getHomePage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(projectHomeService.getHomePage(
                userDetails.getUsername(),
                projectId
        ));
    }
}
