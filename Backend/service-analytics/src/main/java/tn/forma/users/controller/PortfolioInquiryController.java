package tn.forma.users.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import tn.forma.users.dto.PortfolioInquiriesPageDto;
import tn.forma.users.dto.PortfolioInquiryDto;
import tn.forma.users.dto.UpdatePortfolioInquiryStatusRequest;
import tn.forma.users.service.PortfolioInquiryService;

@RestController
@RequestMapping("/api/projects/{projectId}/inquiries")
@RequiredArgsConstructor
public class PortfolioInquiryController {

    private final PortfolioInquiryService portfolioInquiryService;

    @GetMapping
    public ResponseEntity<PortfolioInquiriesPageDto> getInquiriesPage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(portfolioInquiryService.getInquiriesPage(userDetails.getUsername(), projectId));
    }

    @PatchMapping("/{inquiryId}/status")
    public ResponseEntity<PortfolioInquiryDto> updateInquiryStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @PathVariable Long inquiryId,
            @Valid @RequestBody UpdatePortfolioInquiryStatusRequest request
    ) {
        return ResponseEntity.ok(portfolioInquiryService.updateInquiryStatus(
                userDetails.getUsername(),
                projectId,
                inquiryId,
                request
        ));
    }
}
