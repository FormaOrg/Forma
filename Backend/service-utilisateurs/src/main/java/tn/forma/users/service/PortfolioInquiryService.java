package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.PortfolioInquiriesPageDto;
import tn.forma.users.dto.PortfolioInquiryDto;
import tn.forma.users.dto.UpdatePortfolioInquiryStatusRequest;
import tn.forma.users.model.*;
import tn.forma.users.repository.PortfolioInquiryRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PortfolioInquiryService {

    private final ProjectRepository projectRepository;
    private final PortfolioInquiryRepository portfolioInquiryRepository;
    private final UserRepository userRepository;
    private final ProjectAccessService projectAccessService;

    public PortfolioInquiriesPageDto getInquiriesPage(String email, Long projectId) {
        Project project = getAccessibleProject(email, projectId);
        List<PortfolioInquiry> inquiries = portfolioInquiryRepository.findAllByProjectIdOrderByCreatedAtDesc(project.getId());

        return PortfolioInquiriesPageDto.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .inquiries(inquiries.stream().map(this::mapToDto).toList())
                .build();
    }

    @Transactional
    public PortfolioInquiryDto updateInquiryStatus(
            String email,
            Long projectId,
            Long inquiryId,
            UpdatePortfolioInquiryStatusRequest request
    ) {
        getEditableProject(email, projectId);
        PortfolioInquiry inquiry = portfolioInquiryRepository.findByIdAndProjectId(inquiryId, projectId)
                .orElseThrow(() -> new RuntimeException("Inquiry not found"));

        inquiry.setStatus(parseStatus(request.getStatus()));
        return mapToDto(portfolioInquiryRepository.save(inquiry));
    }

    @Transactional
    public void deleteInquiriesForProject(Long projectId) {
        portfolioInquiryRepository.deleteAllByProjectId(projectId);
    }

    private PortfolioInquiryDto mapToDto(PortfolioInquiry inquiry) {
        return PortfolioInquiryDto.builder()
                .id(inquiry.getId())
                .name(inquiry.getName())
                .email(inquiry.getEmail())
                .serviceLabel(inquiry.getServiceLabel())
                .budgetLabel(inquiry.getBudgetLabel())
                .status(inquiry.getStatus().name().toLowerCase(Locale.ROOT))
                .statusLabel(switch (inquiry.getStatus()) {
                    case NEW -> "New";
                    case REPLIED -> "Replied";
                    case SCHEDULED -> "Call scheduled";
                })
                .sourceLabel(inquiry.getSourceLabel())
                .message(inquiry.getMessage())
                .createdAt(Objects.toString(inquiry.getCreatedAt(), null))
                .updatedAt(Objects.toString(inquiry.getUpdatedAt(), null))
                .build();
    }

    private PortfolioInquiryStatus parseStatus(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            throw new RuntimeException("Inquiry status is required");
        }

        try {
            return PortfolioInquiryStatus.valueOf(rawStatus.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new RuntimeException("Invalid inquiry status");
        }
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
}
