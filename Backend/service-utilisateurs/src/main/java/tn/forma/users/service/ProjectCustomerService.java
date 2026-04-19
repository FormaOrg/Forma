package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.CreateProjectCustomerRequest;
import tn.forma.users.dto.ProjectCustomerDto;
import tn.forma.users.dto.ProjectCustomersPageDto;
import tn.forma.users.dto.ProjectCustomersSummaryDto;
import tn.forma.users.dto.UpdateProjectCustomerRequest;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectCustomer;
import tn.forma.users.model.ProjectOrder;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectCustomerRepository;
import tn.forma.users.repository.ProjectOrderRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectCustomerService {

    private final ProjectRepository projectRepository;
    private final ProjectCustomerRepository projectCustomerRepository;
    private final ProjectOrderRepository projectOrderRepository;
    private final UserRepository userRepository;
    private final ProjectAccessService projectAccessService;

    public ProjectCustomersPageDto getCustomersPage(
            String email,
            Long projectId,
            String search,
            String zone
    ) {
        Project project = getAccessibleProject(email, projectId);
        List<ProjectCustomer> allCustomers = projectCustomerRepository.findAllByProjectIdOrderByCreatedAtDesc(project.getId());
        List<ProjectOrder> allOrders = projectOrderRepository.findAllByProjectIdOrderByPlacedAtDesc(project.getId());
        Map<Long, CustomerOrderSnapshot> orderStats = buildOrderStats(allOrders);

        String normalizedSearch = normalize(search);
        String normalizedZone = normalize(zone);

        List<ProjectCustomerDto> customers = allCustomers.stream()
                .map(customer -> mapToDto(customer, orderStats.get(customer.getId())))
                .filter(customer -> matchesSearch(customer, normalizedSearch))
                .filter(customer -> normalizedZone == null || normalizedZone.equals(normalize(customer.getZoneLabel())))
                .sorted(Comparator.comparing(ProjectCustomerDto::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        List<String> zones = allCustomers.stream()
                .map(ProjectCustomer::getZoneLabel)
                .map(this::blankToNull)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();

        long repeatCustomers = orderStats.values().stream().filter(snapshot -> snapshot.totalOrders() > 1).count();
        long recentCustomers = allCustomers.stream()
                .filter(customer -> customer.getCreatedAt() != null && customer.getCreatedAt().isAfter(LocalDateTime.now().minusDays(30)))
                .count();

        return ProjectCustomersPageDto.builder()
                .summary(ProjectCustomersSummaryDto.builder()
                        .totalCustomers(allCustomers.size())
                        .repeatCustomers(repeatCustomers)
                        .recentCustomers(recentCustomers)
                        .activeZones(zones.size())
                        .build())
                .customers(customers)
                .zones(zones)
                .build();
    }

    @Transactional
    public ProjectCustomerDto createCustomer(String email, Long projectId, CreateProjectCustomerRequest request) {
        Project project = getEditableProject(email, projectId);

        ProjectCustomer customer = ProjectCustomer.builder()
                .project(project)
                .firstName(requireValue(request.getFirstName(), "First name is required"))
                .lastName(requireValue(request.getLastName(), "Last name is required"))
                .email(blankToNull(request.getEmail()))
                .phone(blankToNull(request.getPhone()))
                .address(blankToNull(request.getAddress()))
                .zoneLabel(blankToNull(request.getZoneLabel()))
                .build();

        return mapToDto(projectCustomerRepository.save(customer), null);
    }

    @Transactional
    public ProjectCustomerDto updateCustomer(
            String email,
            Long projectId,
            Long customerId,
            UpdateProjectCustomerRequest request
    ) {
        getEditableProject(email, projectId);
        ProjectCustomer customer = getOwnedCustomer(projectId, customerId);

        if (request.getFirstName() != null) {
            customer.setFirstName(requireValue(request.getFirstName(), "First name is required"));
        }
        if (request.getLastName() != null) {
            customer.setLastName(requireValue(request.getLastName(), "Last name is required"));
        }
        if (request.getEmail() != null) {
            customer.setEmail(blankToNull(request.getEmail()));
        }
        if (request.getPhone() != null) {
            customer.setPhone(blankToNull(request.getPhone()));
        }
        if (request.getAddress() != null) {
            customer.setAddress(blankToNull(request.getAddress()));
        }
        if (request.getZoneLabel() != null) {
            customer.setZoneLabel(blankToNull(request.getZoneLabel()));
        }

        CustomerOrderSnapshot snapshot = buildOrderStats(
                projectOrderRepository.findAllByProjectIdOrderByPlacedAtDesc(projectId)
        ).get(customerId);

        return mapToDto(projectCustomerRepository.save(customer), snapshot);
    }

    @Transactional
    public void deleteCustomer(String email, Long projectId, Long customerId) {
        getEditableProject(email, projectId);
        projectCustomerRepository.delete(getOwnedCustomer(projectId, customerId));
    }

    private Map<Long, CustomerOrderSnapshot> buildOrderStats(List<ProjectOrder> orders) {
        return orders.stream()
                .filter(order -> order.getCustomer() != null && order.getCustomer().getId() != null)
                .collect(Collectors.toMap(
                        order -> order.getCustomer().getId(),
                        order -> new CustomerOrderSnapshot(
                                1,
                                amount(order.getTotal()),
                                order.getPlacedAt()
                        ),
                        (left, right) -> new CustomerOrderSnapshot(
                                left.totalOrders() + right.totalOrders(),
                                amount(left.totalSpent().add(right.totalSpent())),
                                latest(left.lastOrderAt(), right.lastOrderAt())
                        )
                ));
    }

    private ProjectCustomerDto mapToDto(ProjectCustomer customer, CustomerOrderSnapshot snapshot) {
        String firstName = customer.getFirstName();
        String lastName = customer.getLastName();

        return ProjectCustomerDto.builder()
                .id(customer.getId())
                .firstName(firstName)
                .lastName(lastName)
                .fullName((firstName + " " + lastName).trim())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .address(customer.getAddress())
                .zoneLabel(customer.getZoneLabel())
                .totalOrders(snapshot != null ? snapshot.totalOrders() : 0)
                .totalSpent(snapshot != null ? snapshot.totalSpent() : amount(null))
                .lastOrderAt(snapshot != null ? Objects.toString(snapshot.lastOrderAt(), null) : null)
                .createdAt(Objects.toString(customer.getCreatedAt(), null))
                .updatedAt(Objects.toString(customer.getUpdatedAt(), null))
                .build();
    }

    private boolean matchesSearch(ProjectCustomerDto customer, String search) {
        if (search == null) {
            return true;
        }

        return containsNormalized(customer.getFullName(), search)
                || containsNormalized(customer.getEmail(), search)
                || containsNormalized(customer.getPhone(), search)
                || containsNormalized(customer.getZoneLabel(), search);
    }

    private boolean containsNormalized(String value, String search) {
        String normalizedValue = normalize(value);
        return normalizedValue != null && normalizedValue.contains(search);
    }

    private Project getOwnedProject(String email, Long projectId) {
        return projectAccessService.getAccessibleProject(email, projectId);
    }

    private Project getAccessibleProject(String email, Long projectId) {
        return projectAccessService.getAccessibleProject(email, projectId);
    }

    private Project getEditableProject(String email, Long projectId) {
        return projectAccessService.getEditableProject(email, projectId);
    }

    private ProjectCustomer getOwnedCustomer(Long projectId, Long customerId) {
        return projectCustomerRepository.findByIdAndProjectId(customerId, projectId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
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

    private String normalize(String value) {
        String trimmed = blankToNull(value);
        return trimmed == null ? null : trimmed.toLowerCase(Locale.ROOT);
    }

    private BigDecimal amount(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private LocalDateTime latest(LocalDateTime left, LocalDateTime right) {
        if (left == null) {
            return right;
        }
        if (right == null) {
            return left;
        }
        return left.isAfter(right) ? left : right;
    }

    private record CustomerOrderSnapshot(long totalOrders, BigDecimal totalSpent, LocalDateTime lastOrderAt) {
    }
}
