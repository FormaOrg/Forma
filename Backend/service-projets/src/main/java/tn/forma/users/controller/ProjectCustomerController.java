package tn.forma.users.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import tn.forma.users.dto.CreateProjectCustomerRequest;
import tn.forma.users.dto.MessageResponse;
import tn.forma.users.dto.ProjectCustomerDto;
import tn.forma.users.dto.ProjectCustomersPageDto;
import tn.forma.users.dto.UpdateProjectCustomerRequest;
import tn.forma.users.service.ProjectCustomerService;

@RestController
@RequestMapping("/api/projects/{projectId}/customers")
@RequiredArgsConstructor
public class ProjectCustomerController {

    private final ProjectCustomerService projectCustomerService;

    @GetMapping
    public ResponseEntity<ProjectCustomersPageDto> getCustomersPage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String zone
    ) {
        return ResponseEntity.ok(projectCustomerService.getCustomersPage(
                userDetails.getUsername(),
                projectId,
                search,
                zone
        ));
    }

    @PostMapping
    public ResponseEntity<ProjectCustomerDto> createCustomer(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @Valid @RequestBody CreateProjectCustomerRequest request
    ) {
        return ResponseEntity.ok(projectCustomerService.createCustomer(
                userDetails.getUsername(),
                projectId,
                request
        ));
    }

    @PutMapping("/{customerId}")
    public ResponseEntity<ProjectCustomerDto> updateCustomer(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @PathVariable Long customerId,
            @Valid @RequestBody UpdateProjectCustomerRequest request
    ) {
        return ResponseEntity.ok(projectCustomerService.updateCustomer(
                userDetails.getUsername(),
                projectId,
                customerId,
                request
        ));
    }

    @DeleteMapping("/{customerId}")
    public ResponseEntity<MessageResponse> deleteCustomer(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @PathVariable Long customerId
    ) {
        projectCustomerService.deleteCustomer(userDetails.getUsername(), projectId, customerId);
        return ResponseEntity.ok(new MessageResponse("Customer deleted successfully"));
    }
}
