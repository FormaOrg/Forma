package tn.forma.users.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.forma.users.dto.ProjectBlogCategoryDto;
import tn.forma.users.dto.ProjectBlogPostDto;
import tn.forma.users.dto.ProjectBlogSubscriberDto;
import tn.forma.users.service.ProjectBlogWorkspaceService;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}")
@RequiredArgsConstructor
public class ProjectBlogWorkspaceController {

    private final ProjectBlogWorkspaceService projectBlogWorkspaceService;

    @GetMapping("/posts")
    public ResponseEntity<List<ProjectBlogPostDto>> getPosts(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(projectBlogWorkspaceService.getPosts(userDetails.getUsername(), projectId));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<ProjectBlogCategoryDto>> getCategories(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(projectBlogWorkspaceService.getCategories(userDetails.getUsername(), projectId));
    }

    @GetMapping("/subscribers")
    public ResponseEntity<List<ProjectBlogSubscriberDto>> getSubscribers(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(projectBlogWorkspaceService.getSubscribers(userDetails.getUsername(), projectId));
    }
}
