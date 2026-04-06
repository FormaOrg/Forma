package tn.forma.users.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import tn.forma.users.dto.PublicCheckoutRequest;
import tn.forma.users.dto.PublicCheckoutResponse;
import tn.forma.users.dto.PublicStorefrontHomeDto;
import tn.forma.users.dto.PublicStorefrontProductDto;
import tn.forma.users.service.PublicCheckoutService;
import tn.forma.users.service.PublicStorefrontService;

import java.util.List;

@RestController
@RequestMapping("/api/public/projects/{projectId}")
@RequiredArgsConstructor
public class PublicStorefrontController {

    private final PublicStorefrontService publicStorefrontService;
    private final PublicCheckoutService publicCheckoutService;

    @GetMapping("/storefront")
    public ResponseEntity<PublicStorefrontHomeDto> getStorefrontHome(@PathVariable Long projectId) {
        return ResponseEntity.ok(publicStorefrontService.getPublishedStorefrontHome(projectId));
    }

    @GetMapping("/products")
    public ResponseEntity<List<PublicStorefrontProductDto>> getProducts(@PathVariable Long projectId) {
        return ResponseEntity.ok(publicStorefrontService.getPublishedProducts(projectId));
    }

    @GetMapping("/products/{productId}")
    public ResponseEntity<PublicStorefrontProductDto> getProduct(
            @PathVariable Long projectId,
            @PathVariable Long productId
    ) {
        return ResponseEntity.ok(publicStorefrontService.getPublishedProduct(projectId, productId));
    }

    @PostMapping("/checkout")
    public ResponseEntity<PublicCheckoutResponse> checkout(
            @PathVariable Long projectId,
            @Valid @RequestBody PublicCheckoutRequest request
    ) {
        return ResponseEntity.ok(publicCheckoutService.checkout(projectId, request));
    }
}
