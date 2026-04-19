package tn.forma.users.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.forma.users.dto.BillingOverviewDto;
import tn.forma.users.dto.UpdateSubscriptionPlanRequest;
import tn.forma.users.model.SubscriptionPlan;
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

    @PutMapping("/subscription")
    public ResponseEntity<MessageResponse> updateSubscriptionPlan(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateSubscriptionPlanRequest request) {
        return ResponseEntity.ok(
                billingService.updateSubscriptionPlan(
                        userDetails.getUsername(),
                        SubscriptionPlan.valueOf(request.getPlan().trim().toUpperCase())
                )
        );
    }
}
