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
import tn.forma.users.dto.ProjectIconLibraryItemDto;
import tn.forma.users.service.ProjectIconLibraryService;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/icons")
@RequiredArgsConstructor
public class ProjectIconLibraryController {

    private final ProjectIconLibraryService projectIconLibraryService;

    @GetMapping("/search")
    public ResponseEntity<List<ProjectIconLibraryItemDto>> searchIcons(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "limit", required = false) Integer limit) {
        return ResponseEntity.ok(
                projectIconLibraryService.searchProjectIcons(userDetails.getUsername(), projectId, query, limit)
        );
    }
}
