package tn.forma.users.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import tn.forma.users.dto.ProjectStorefrontDto;
import tn.forma.users.dto.PublicStorefrontHomeDto;
import tn.forma.users.dto.PublicStorefrontProductDto;
import tn.forma.users.dto.PublishProjectStorefrontResponse;
import tn.forma.users.dto.UpdateProjectStorefrontRequest;
import tn.forma.users.service.ProjectStorefrontService;
import tn.forma.users.service.PublicStorefrontService;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/storefront")
@RequiredArgsConstructor
public class ProjectStorefrontController {

    private final ProjectStorefrontService projectStorefrontService;
    private final PublicStorefrontService publicStorefrontService;

    @GetMapping
    public ResponseEntity<ProjectStorefrontDto> getStorefront(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(projectStorefrontService.getStorefront(
                userDetails.getUsername(),
                projectId
        ));
    }

    @PutMapping
    public ResponseEntity<ProjectStorefrontDto> updateStorefront(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @Valid @RequestBody UpdateProjectStorefrontRequest request
    ) {
        return ResponseEntity.ok(projectStorefrontService.updateStorefront(
                userDetails.getUsername(),
                projectId,
                request
        ));
    }

    @PostMapping("/publish")
    public ResponseEntity<PublishProjectStorefrontResponse> publishStorefront(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(projectStorefrontService.publishStorefront(
                userDetails.getUsername(),
                projectId
        ));
    }

    @PostMapping("/unpublish")
    public ResponseEntity<ProjectStorefrontDto> unpublishStorefront(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(projectStorefrontService.unpublishStorefront(
                userDetails.getUsername(),
                projectId
        ));
    }

    @GetMapping("/preview")
    public ResponseEntity<PublicStorefrontHomeDto> getPreviewStorefront(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(publicStorefrontService.getPreviewStorefrontHome(
                userDetails.getUsername(),
                projectId
        ));
    }

    @GetMapping("/preview/products")
    public ResponseEntity<List<PublicStorefrontProductDto>> getPreviewProducts(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(publicStorefrontService.getPreviewProducts(
                userDetails.getUsername(),
                projectId
        ));
    }

    @GetMapping("/preview/products/{productId}")
    public ResponseEntity<PublicStorefrontProductDto> getPreviewProduct(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @PathVariable Long productId
    ) {
        return ResponseEntity.ok(publicStorefrontService.getPreviewProduct(
                userDetails.getUsername(),
                projectId,
                productId
        ));
    }
}
