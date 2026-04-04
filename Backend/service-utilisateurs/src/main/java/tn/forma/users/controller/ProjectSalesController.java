package tn.forma.users.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import tn.forma.users.dto.*;
import tn.forma.users.service.ProjectSalesService;

@RestController
@RequestMapping("/api/projects/{projectId}/sales")
@RequiredArgsConstructor
public class ProjectSalesController {

    private final ProjectSalesService projectSalesService;

    @GetMapping
    public ResponseEntity<ProjectSalesPageDto> getSalesPage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "LAST_30_DAYS") String range,
            @RequestParam(defaultValue = "false") boolean compare,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "PLACED_AT_DESC") String sort,
            @RequestParam(defaultValue = "ALL") String filter,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "5") Integer size
    ) {
        return ResponseEntity.ok(projectSalesService.getSalesPage(
                userDetails.getUsername(),
                projectId,
                SalesRangePreset.fromNullable(range),
                compare,
                search,
                SalesOrderSort.fromNullable(sort),
                SalesOrderFilter.fromNullable(filter),
                page,
                size
        ));
    }

    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportSalesOrders(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "LAST_30_DAYS") String range,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "PLACED_AT_DESC") String sort,
            @RequestParam(defaultValue = "ALL") String filter
    ) {
        byte[] csv = projectSalesService.exportOrdersCsv(
                userDetails.getUsername(),
                projectId,
                SalesRangePreset.fromNullable(range),
                search,
                SalesOrderSort.fromNullable(sort),
                SalesOrderFilter.fromNullable(filter)
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"sales-orders.csv\"")
                .contentType(new MediaType("text", "csv"))
                .body(csv);
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ProjectSalesOrderEditorDto> getOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @PathVariable Long orderId
    ) {
        return ResponseEntity.ok(projectSalesService.getOrder(
                userDetails.getUsername(),
                projectId,
                orderId
        ));
    }

    @PostMapping("/orders")
    public ResponseEntity<ProjectSalesOrderEditorDto> createOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @Valid @RequestBody CreateProjectOrderRequest request
    ) {
        return ResponseEntity.ok(projectSalesService.createOrder(
                userDetails.getUsername(),
                projectId,
                request
        ));
    }

    @PutMapping("/orders/{orderId}")
    public ResponseEntity<ProjectSalesOrderEditorDto> updateOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateProjectOrderRequest request
    ) {
        return ResponseEntity.ok(projectSalesService.updateOrder(
                userDetails.getUsername(),
                projectId,
                orderId,
                request
        ));
    }
}
