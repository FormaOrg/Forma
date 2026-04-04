package tn.forma.users.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import tn.forma.users.dto.CreateProjectProductRequest;
import tn.forma.users.dto.MessageResponse;
import tn.forma.users.dto.ProjectCatalogPageDto;
import tn.forma.users.dto.ProjectCatalogProductDto;
import tn.forma.users.dto.UpdateProjectProductRequest;
import tn.forma.users.service.ProjectCatalogService;

@RestController
@RequestMapping("/api/projects/{projectId}/catalog")
@RequiredArgsConstructor
public class ProjectCatalogController {

    private final ProjectCatalogService projectCatalogService;

    @GetMapping
    public ResponseEntity<ProjectCatalogPageDto> getCatalogPage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(projectCatalogService.getCatalogPage(
                userDetails.getUsername(),
                projectId,
                search,
                status,
                category
        ));
    }

    @PostMapping
    public ResponseEntity<ProjectCatalogProductDto> createProduct(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @Valid @RequestBody CreateProjectProductRequest request
    ) {
        return ResponseEntity.ok(projectCatalogService.createProduct(
                userDetails.getUsername(),
                projectId,
                request
        ));
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ProjectCatalogProductDto> updateProduct(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @PathVariable Long productId,
            @Valid @RequestBody UpdateProjectProductRequest request
    ) {
        return ResponseEntity.ok(projectCatalogService.updateProduct(
                userDetails.getUsername(),
                projectId,
                productId,
                request
        ));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<MessageResponse> deleteProduct(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @PathVariable Long productId
    ) {
        projectCatalogService.deleteProduct(userDetails.getUsername(), projectId, productId);
        return ResponseEntity.ok(new MessageResponse("Product deleted successfully"));
    }
}
