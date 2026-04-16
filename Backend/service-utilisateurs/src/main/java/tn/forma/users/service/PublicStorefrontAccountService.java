package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.PublicStorefrontAccountLoginRequest;
import tn.forma.users.dto.PublicStorefrontAccountRegisterRequest;
import tn.forma.users.dto.PublicStorefrontCustomerAccountResponse;
import tn.forma.users.dto.PublicStorefrontCustomerOrderDto;
import tn.forma.users.dto.PublicStorefrontCustomerProfileDto;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectCustomer;
import tn.forma.users.model.ProjectOrder;
import tn.forma.users.model.ProjectType;
import tn.forma.users.repository.ProjectCustomerRepository;
import tn.forma.users.repository.ProjectOrderRepository;
import tn.forma.users.repository.ProjectRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PublicStorefrontAccountService {

    private static final int SESSION_DAYS = 30;

    private final ProjectRepository projectRepository;
    private final ProjectCustomerRepository projectCustomerRepository;
    private final ProjectOrderRepository projectOrderRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public PublicStorefrontCustomerAccountResponse register(Long projectId, PublicStorefrontAccountRegisterRequest request) {
        Project project = getEcommerceProject(projectId);
        String normalizedEmail = requireEmail(request.getEmail());

        if (projectCustomerRepository.findByProjectIdAndEmailIgnoreCase(project.getId(), normalizedEmail).isPresent()) {
            throw new RuntimeException("An account with this email already exists for this storefront");
        }

        ProjectCustomer customer = ProjectCustomer.builder()
                .project(project)
                .firstName(requireValue(request.getFirstName(), "First name is required"))
                .lastName(requireValue(request.getLastName(), "Last name is required"))
                .email(normalizedEmail)
                .phone(blankToNull(request.getPhone()))
                .address(blankToNull(request.getAddress()))
                .accountPasswordHash(passwordEncoder.encode(request.getPassword()))
                .accountEnabled(true)
                .build();

        return openSession(projectCustomerRepository.save(customer));
    }

    @Transactional
    public PublicStorefrontCustomerAccountResponse login(Long projectId, PublicStorefrontAccountLoginRequest request) {
        Project project = getEcommerceProject(projectId);
        String normalizedEmail = requireEmail(request.getEmail());

        ProjectCustomer customer = projectCustomerRepository.findByProjectIdAndEmailIgnoreCase(project.getId(), normalizedEmail)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        if (!customer.isAccountEnabled() || customer.getAccountPasswordHash() == null) {
            throw new RuntimeException("Account is not enabled. Please register first.");
        }

        if (!passwordEncoder.matches(request.getPassword(), customer.getAccountPasswordHash())) {
            throw new RuntimeException("Incorrect email or password");
        }

        return openSession(customer);
    }

    @Transactional(readOnly = true)
    public PublicStorefrontCustomerAccountResponse getAccount(Long projectId, String rawSessionToken) {
        ProjectCustomer customer = requireAuthenticatedCustomer(projectId, rawSessionToken);
        return buildAccountResponse(customer, rawSessionToken, customer.getAccountSessionExpiresAt());
    }

    @Transactional
    public void logout(Long projectId, String rawSessionToken) {
        if (blankToNull(rawSessionToken) == null) {
            return;
        }

        projectCustomerRepository.findByProjectIdAndAccountSessionHash(projectId, hashSessionToken(rawSessionToken))
                .ifPresent(customer -> {
                    customer.setAccountSessionHash(null);
                    customer.setAccountSessionExpiresAt(null);
                    projectCustomerRepository.save(customer);
                });
    }

    @Transactional(readOnly = true)
    public Optional<ProjectCustomer> resolveAuthenticatedCustomer(Long projectId, String rawSessionToken) {
        String token = blankToNull(rawSessionToken);
        if (token == null) {
            return Optional.empty();
        }

        return projectCustomerRepository.findByProjectIdAndAccountSessionHash(projectId, hashSessionToken(token))
                .filter(customer -> customer.getAccountSessionExpiresAt() != null)
                .filter(customer -> customer.getAccountSessionExpiresAt().isAfter(LocalDateTime.now()));
    }

    private PublicStorefrontCustomerAccountResponse openSession(ProjectCustomer customer) {
        String rawToken = UUID.randomUUID() + "." + UUID.randomUUID();
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(SESSION_DAYS);

        customer.setAccountEnabled(true);
        customer.setAccountSessionHash(hashSessionToken(rawToken));
        customer.setAccountSessionExpiresAt(expiresAt);
        customer.setAccountLastLoginAt(LocalDateTime.now());

        ProjectCustomer saved = projectCustomerRepository.save(customer);
        return buildAccountResponse(saved, rawToken, expiresAt);
    }

    private PublicStorefrontCustomerAccountResponse buildAccountResponse(
            ProjectCustomer customer,
            String rawSessionToken,
            LocalDateTime expiresAt
    ) {
        List<PublicStorefrontCustomerOrderDto> orders = projectOrderRepository
                .findAllByProjectIdAndCustomerIdOrderByPlacedAtDesc(customer.getProject().getId(), customer.getId())
                .stream()
                .map(this::mapOrder)
                .toList();

        return PublicStorefrontCustomerAccountResponse.builder()
                .sessionToken(rawSessionToken)
                .expiresAt(Objects.toString(expiresAt, null))
                .customer(PublicStorefrontCustomerProfileDto.builder()
                        .customerId(customer.getId())
                        .firstName(customer.getFirstName())
                        .lastName(customer.getLastName())
                        .fullName((customer.getFirstName() + " " + customer.getLastName()).trim())
                        .email(customer.getEmail())
                        .phone(customer.getPhone())
                        .address(customer.getAddress())
                        .createdAt(Objects.toString(customer.getCreatedAt(), null))
                        .build())
                .orders(orders)
                .build();
    }

    private PublicStorefrontCustomerOrderDto mapOrder(ProjectOrder order) {
        return PublicStorefrontCustomerOrderDto.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .placedAt(Objects.toString(order.getPlacedAt(), null))
                .paymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : null)
                .fulfillmentStatus(order.getFulfillmentStatus() != null ? order.getFulfillmentStatus().name() : null)
                .total(order.getTotal())
                .build();
    }

    private ProjectCustomer requireAuthenticatedCustomer(Long projectId, String rawSessionToken) {
        return resolveAuthenticatedCustomer(projectId, rawSessionToken)
                .orElseThrow(() -> new RuntimeException("Invalid or expired account session"));
    }

    private Project getEcommerceProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (project.getType() != ProjectType.ECOMMERCE) {
            throw new RuntimeException("Storefront account is only available for ecommerce projects");
        }

        return project;
    }

    private String hashSessionToken(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Unable to hash session token", exception);
        }
    }

    private String requireEmail(String value) {
        String trimmed = requireValue(value, "Email is required").toLowerCase(Locale.ROOT);
        if (!trimmed.contains("@")) {
            throw new RuntimeException("Invalid email address");
        }
        return trimmed;
    }

    private String requireValue(String value, String message) {
        String trimmed = blankToNull(value);
        if (trimmed == null) {
            throw new RuntimeException(message);
        }
        return trimmed;
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
