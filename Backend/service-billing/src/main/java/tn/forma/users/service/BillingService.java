package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.*;
import tn.forma.users.model.*;
import tn.forma.users.repository.*;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final BillingInvoiceRepository billingInvoiceRepository;
    private final BillingPaymentMethodRepository billingPaymentMethodRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM d, yyyy");
    private static final DecimalFormat MONEY_FORMAT = new DecimalFormat("0.##");

    public BillingOverviewDto getOverview(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Subscription subscription = subscriptionRepository.findTopByUserIdOrderByUpdatedAtDesc(user.getId())
                .orElse(null);
        List<BillingInvoice> invoices = billingInvoiceRepository.findTop8BySubscriptionUserIdOrderByInvoiceDateDescCreatedAtDesc(user.getId());
        BillingPaymentMethod paymentMethod = billingPaymentMethodRepository.findByUserId(user.getId())
                .orElse(null);

        long activeProjectsCount = projectRepository.countByUserId(user.getId());
        long publishedProjectsCount = projectRepository.countByUserIdAndStatus(user.getId(), ProjectStatus.PUBLISHED);
        long draftProjectsCount = projectRepository.countByUserIdAndStatus(user.getId(), ProjectStatus.DRAFT);
        long paidInvoicesCount = billingInvoiceRepository.countBySubscriptionUserIdAndStatus(user.getId(), BillingInvoiceStatus.PAID);

        return BillingOverviewDto.builder()
                .subscription(toSubscriptionDto(subscription))
                .usage(buildUsageMetrics(subscription, activeProjectsCount, publishedProjectsCount, draftProjectsCount))
                .paymentMethod(toPaymentMethodDto(paymentMethod, user, subscription))
                .invoices(invoices.stream().map(this::toInvoiceDto).toList())
                .activeProjectsCount(activeProjectsCount)
                .paidInvoicesCount(paidInvoicesCount)
                .currentSpendLabel(buildCurrentSpendLabel(subscription))
                .build();
    }

    @Transactional
    public MessageResponse updateSubscriptionPlan(String email, SubscriptionPlan plan) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Subscription subscription = subscriptionRepository.findTopByUserIdOrderByUpdatedAtDesc(user.getId())
                .orElseGet(() -> Subscription.builder()
                        .user(user)
                        .status(SubscriptionStatus.ACTIVE)
                        .billingMode(SubscriptionBillingMode.MONTHLY)
                        .startDate(LocalDate.now())
                        .autoRenew(true)
                        .build());

        subscription.setPlanType(plan);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setBillingMode(subscription.getBillingMode() == null
                ? SubscriptionBillingMode.MONTHLY
                : subscription.getBillingMode());
        subscription.setStartDate(subscription.getStartDate() == null ? LocalDate.now() : subscription.getStartDate());
        subscription.setRenewalDate(LocalDate.now().plusMonths(1));
        subscription.setEndDate(null);
        subscription.setPriceTnd(resolveMonthlyPrice(plan));
        subscriptionRepository.save(subscription);

        return new MessageResponse("Subscription updated successfully");
    }

    private List<BillingUsageMetricDto> buildUsageMetrics(
            Subscription subscription,
            long activeProjectsCount,
            long publishedProjectsCount,
            long draftProjectsCount) {
        Long projectLimit = subscription == null ? null : getProjectLimit(subscription.getPlanType());
        Long publishedLimit = subscription == null ? null : getPublishedLimit(subscription.getPlanType());

        return List.of(
                BillingUsageMetricDto.builder()
                        .label("Projects")
                        .used(activeProjectsCount)
                        .limit(projectLimit)
                        .unit("sites")
                        .note(subscription == null
                                ? "Project totals are synced from your account while billing stays inactive."
                                : "Project usage is tracked from your live workspace.")
                        .build(),
                BillingUsageMetricDto.builder()
                        .label("Published sites")
                        .used(publishedProjectsCount)
                        .limit(publishedLimit)
                        .unit("live sites")
                        .note(publishedProjectsCount > 0
                                ? "Published sites are synced from your deployed project list."
                                : "Publish a project to start filling this billing metric.")
                        .build(),
                BillingUsageMetricDto.builder()
                        .label("Drafts")
                        .used(draftProjectsCount)
                        .limit(null)
                        .unit("drafts")
                        .note(draftProjectsCount > 0
                                ? "Draft projects are still in progress inside your workspace."
                                : "No draft projects are waiting in your current workspace.")
                        .build()
        );
    }

    private BillingSubscriptionDto toSubscriptionDto(Subscription subscription) {
        if (subscription == null) {
            return BillingSubscriptionDto.builder()
                    .status("inactive")
                    .billingMode("yearly")
                    .build();
        }

        return BillingSubscriptionDto.builder()
                .planName(toPlanName(subscription.getPlanType()))
                .planDescription(toPlanDescription(subscription.getPlanType()))
                .status(toStatus(subscription.getStatus()))
                .billingMode(toBillingMode(subscription.getBillingMode()))
                .billingCycleLabel(subscription.getBillingMode() == SubscriptionBillingMode.MONTHLY
                        ? "Billed monthly"
                        : "Billed yearly")
                .renewalDateLabel(formatDate(subscription.getRenewalDate()))
                .nextChargeLabel(buildNextChargeLabel(subscription))
                .promoNotice(subscription.isAutoRenew()
                        ? null
                        : "Auto-renew is turned off for this subscription.")
                .build();
    }

    private BillingPaymentMethodDto toPaymentMethodDto(
            BillingPaymentMethod paymentMethod,
            User user,
            Subscription subscription) {
        if (paymentMethod == null) {
            return subscription == null ? null : BillingPaymentMethodDto.builder()
                    .contactEmail(user.getEmail())
                    .summary("No saved payment method is on file for this subscription yet.")
                    .build();
        }

        return BillingPaymentMethodDto.builder()
                .brand(paymentMethod.getBrand())
                .last4(paymentMethod.getLast4())
                .expiryLabel(formatExpiry(paymentMethod.getExpiryMonth(), paymentMethod.getExpiryYear()))
                .contactEmail(paymentMethod.getBillingEmail() != null ? paymentMethod.getBillingEmail() : user.getEmail())
                .summary("Payments are routed through your saved billing method.")
                .build();
    }

    private BillingInvoiceDto toInvoiceDto(BillingInvoice invoice) {
        return BillingInvoiceDto.builder()
                .id(invoice.getInvoiceNumber())
                .dateLabel(formatDate(invoice.getInvoiceDate()))
                .amountLabel(formatMoney(invoice.getAmountTnd()))
                .statusLabel(toInvoiceStatusLabel(invoice.getStatus()))
                .downloadUrl(invoice.getDownloadUrl())
                .build();
    }

    private Long getProjectLimit(SubscriptionPlan plan) {
        return switch (plan) {
            case STARTER -> 5L;
            case PRO, BUSINESS -> null;
        };
    }

    private Long getPublishedLimit(SubscriptionPlan plan) {
        return switch (plan) {
            case STARTER -> 1L;
            case PRO -> 25L;
            case BUSINESS -> null;
        };
    }

    private String buildCurrentSpendLabel(Subscription subscription) {
        if (subscription == null) {
            return "No active plan";
        }

        return formatMoney(subscription.getPriceTnd()) + " / month";
    }

    private String buildNextChargeLabel(Subscription subscription) {
        String amount = formatMoney(subscription.getPriceTnd());
        String date = formatDate(subscription.getRenewalDate());
        return date == null ? amount : amount + " on " + date;
    }

    private String toPlanName(SubscriptionPlan plan) {
        return switch (plan) {
            case STARTER -> "Starter";
            case PRO -> "Pro";
            case BUSINESS -> "Business";
        };
    }

    private String toPlanDescription(SubscriptionPlan plan) {
        return switch (plan) {
            case STARTER -> "Perfect for individuals and smaller website launches.";
            case PRO -> "Best for growing teams shipping multiple live experiences.";
            case BUSINESS -> "Built for larger operations with broader scale and support.";
        };
    }

    private String toStatus(SubscriptionStatus status) {
        return switch (status) {
            case ACTIVE -> "active";
            case TRIAL -> "trial";
            case CANCELED -> "canceled";
            case PAST_DUE -> "past-due";
        };
    }

    private String toBillingMode(SubscriptionBillingMode mode) {
        return mode == SubscriptionBillingMode.MONTHLY ? "monthly" : "yearly";
    }

    private String toInvoiceStatusLabel(BillingInvoiceStatus status) {
        return switch (status) {
            case PAID -> "Paid";
            case PENDING -> "Pending";
            case FAILED -> "Failed";
        };
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) {
            return "0 DT";
        }

        return MONEY_FORMAT.format(amount) + " DT";
    }

    private String formatDate(LocalDate date) {
        return date == null ? null : date.format(DATE_FORMATTER);
    }

    private BigDecimal resolveMonthlyPrice(SubscriptionPlan plan) {
        return switch (plan) {
            case STARTER -> BigDecimal.ZERO;
            case PRO -> BigDecimal.valueOf(59);
            case BUSINESS -> BigDecimal.valueOf(99);
        };
    }

    private String formatExpiry(Integer month, Integer year) {
        if (month == null || year == null) {
            return null;
        }

        return String.format("Expires %02d/%s", month, year);
    }
}
