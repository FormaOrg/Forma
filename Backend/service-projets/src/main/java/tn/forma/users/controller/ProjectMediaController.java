package tn.forma.users.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.forma.users.dto.ImportProjectMediaRequest;
import tn.forma.users.dto.MessageResponse;
import tn.forma.users.dto.ProjectMediaDto;
import tn.forma.users.service.ProjectMediaService;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/media")
@RequiredArgsConstructor
public class ProjectMediaController {

    private final ProjectMediaService projectMediaService;

    @GetMapping
    public ResponseEntity<List<ProjectMediaDto>> getProjectMedia(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(projectMediaService.getProjectMedia(userDetails.getUsername(), projectId));
    }

    @PostMapping
    public ResponseEntity<ProjectMediaDto> uploadProjectMedia(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(projectMediaService.uploadProjectMedia(userDetails.getUsername(), projectId, file));
    }

    @PostMapping("/import")
    public ResponseEntity<ProjectMediaDto> importProjectMedia(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @Valid @RequestBody ImportProjectMediaRequest request
    ) {
        return ResponseEntity.ok(projectMediaService.importProjectMedia(userDetails.getUsername(), projectId, request));
    }

    @DeleteMapping("/{mediaId}")
    public ResponseEntity<MessageResponse> deleteProjectMedia(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @PathVariable Long mediaId
    ) {
        projectMediaService.deleteProjectMedia(userDetails.getUsername(), projectId, mediaId);
        return ResponseEntity.ok(new MessageResponse("Media deleted successfully"));
    }
}
