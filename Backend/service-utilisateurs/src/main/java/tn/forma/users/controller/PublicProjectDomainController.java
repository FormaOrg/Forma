package tn.forma.users.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tn.forma.users.dto.ResolvedPublicProjectDto;
import tn.forma.users.service.PublicProjectDomainService;

@RestController
@RequestMapping("/api/public/domains")
@RequiredArgsConstructor
public class PublicProjectDomainController {

    private final PublicProjectDomainService publicProjectDomainService;

    @GetMapping("/resolve")
    public ResponseEntity<ResolvedPublicProjectDto> resolvePublishedProject(
            @RequestParam(required = false) String host,
            HttpServletRequest request) {
        String resolvedHost = firstNonBlank(
                host,
                readForwardedHost(request),
                request.getHeader("Host"),
                request.getServerName()
        );

        return ResponseEntity.ok(publicProjectDomainService.resolvePublishedProject(resolvedHost));
    }

    private String readForwardedHost(HttpServletRequest request) {
        String forwardedHost = request.getHeader("X-Forwarded-Host");
        if (forwardedHost == null || forwardedHost.isBlank()) {
            return null;
        }

        String[] forwardedHosts = forwardedHost.split(",");
        return forwardedHosts.length == 0 ? null : forwardedHosts[0].trim();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }

        return null;
    }
}
