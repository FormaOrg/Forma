package tn.forma.users.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.forma.users.dto.PortfolioPagesPageDto;
import tn.forma.users.service.PortfolioPageService;

@RestController
@RequestMapping("/api/projects/{projectId}/pages")
@RequiredArgsConstructor
public class PortfolioPageController {

    private final PortfolioPageService portfolioPageService;

    @GetMapping
    public ResponseEntity<PortfolioPagesPageDto> getPagesPage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(portfolioPageService.getPagesPage(userDetails.getUsername(), projectId));
    }
}
