package tn.forma.users.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import tn.forma.users.dto.CreateProjectRequest;
import tn.forma.users.dto.MessageResponse;
import tn.forma.users.dto.ProjectDto;
import tn.forma.users.dto.UpdateProjectRequest;
import tn.forma.users.service.ProjectService;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<ProjectDto>> getMyProjects(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(projectService.getMyProjects(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> getProjectById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(userDetails.getUsername(), id));
    }

    @PostMapping
    public ResponseEntity<ProjectDto> createProject(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.ok(projectService.createProject(userDetails.getUsername(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectDto> updateProject(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(userDetails.getUsername(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteProject(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        projectService.deleteProject(userDetails.getUsername(), id);
        return ResponseEntity.ok(new MessageResponse("Project deleted successfully"));
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<ProjectDto> duplicateProject(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(projectService.duplicateProject(userDetails.getUsername(), id));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<ProjectDto> publishProject(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(projectService.publishProject(userDetails.getUsername(), id));
    }
}
