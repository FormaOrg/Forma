package tn.forma.users.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.forma.users.dto.BillingOverviewDto;
import tn.forma.users.service.BillingService;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @GetMapping("/overview")
    public ResponseEntity<BillingOverviewDto> getOverview(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(billingService.getOverview(userDetails.getUsername()));
    }
}
