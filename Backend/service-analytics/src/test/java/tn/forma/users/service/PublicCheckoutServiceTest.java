package tn.forma.users.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.forma.users.dto.PublicCheckoutItemRequest;
import tn.forma.users.dto.PublicCheckoutRequest;
import tn.forma.users.model.CreationMethod;
import tn.forma.users.model.OrderFulfillmentStatus;
import tn.forma.users.model.OrderPaymentStatus;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectCustomer;
import tn.forma.users.model.ProjectOrder;
import tn.forma.users.model.ProjectProduct;
import tn.forma.users.model.ProjectProductStatus;
import tn.forma.users.model.ProjectProductType;
import tn.forma.users.model.ProjectStatus;
import tn.forma.users.model.ProjectStorefront;
import tn.forma.users.model.ProjectType;
import tn.forma.users.model.StorefrontStatus;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectCustomerRepository;
import tn.forma.users.repository.ProjectOrderRepository;
import tn.forma.users.repository.ProjectProductRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.ProjectStorefrontRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PublicCheckoutServiceTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectStorefrontRepository projectStorefrontRepository;
    @Mock
    private ProjectProductRepository projectProductRepository;
    @Mock
    private ProjectCustomerRepository projectCustomerRepository;
    @Mock
    private ProjectOrderRepository projectOrderRepository;

    @Test
    void checkoutCreatesCustomerAndOrderUsingPublishedStorefront() {
        Project project = buildProject();
        ProjectStorefront storefront = ProjectStorefront.builder()
                .id(21L)
                .project(project)
                .storeStatus(StorefrontStatus.PUBLISHED)
                .publishedHomepageJson(new com.fasterxml.jackson.databind.ObjectMapper().createObjectNode().put("version", 1))
                .build();
        ProjectProduct product = ProjectProduct.builder()
                .id(11L)
                .project(project)
                .name("Amber Vase")
                .sku("SKU-11")
                .status(ProjectProductStatus.ACTIVE)
                .productType(ProjectProductType.PHYSICAL)
                .price(new BigDecimal("95.00"))
                .inventoryQuantity(3)
                .imageUrl("https://img/amber.png")
                .build();

        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(projectStorefrontRepository.findByProjectId(project.getId())).thenReturn(Optional.of(storefront));
        when(projectCustomerRepository.findFirstByProjectIdAndEmailIgnoreCase(project.getId(), "shopper@example.com"))
                .thenReturn(Optional.empty());
        when(projectCustomerRepository.findFirstByProjectIdAndPhone(project.getId(), "+21611111111"))
                .thenReturn(Optional.empty());
        when(projectCustomerRepository.save(any(ProjectCustomer.class))).thenAnswer(invocation -> {
            ProjectCustomer customer = invocation.getArgument(0);
            customer.setId(31L);
            return customer;
        });
        when(projectProductRepository.findByIdAndProjectId(product.getId(), project.getId())).thenReturn(Optional.of(product));
        when(projectOrderRepository.save(any(ProjectOrder.class))).thenAnswer(invocation -> {
            ProjectOrder order = invocation.getArgument(0);
            order.setId(51L);
            return order;
        });

        PublicCheckoutService service = new PublicCheckoutService(
                projectRepository,
                projectStorefrontRepository,
                projectProductRepository,
                projectCustomerRepository,
                projectOrderRepository
        );

        PublicCheckoutRequest request = new PublicCheckoutRequest();
        request.setFirstName("Amina");
        request.setLastName("Ben Salah");
        request.setPhone("+21611111111");
        request.setEmail("shopper@example.com");
        request.setAddress("La Marsa, Tunis");
        request.setNotes("Call on arrival");
        PublicCheckoutItemRequest item = new PublicCheckoutItemRequest();
        item.setProductId(product.getId());
        item.setQuantity(2);
        request.setItems(List.of(item));

        var response = service.checkout(project.getId(), request);

        assertThat(response.getOrderId()).isEqualTo(51L);
        assertThat(response.getTotal()).isEqualByComparingTo("190.00");
        assertThat(response.getCurrencyCode()).isEqualTo("TND");

        ArgumentCaptor<ProjectOrder> orderCaptor = ArgumentCaptor.forClass(ProjectOrder.class);
        verify(projectOrderRepository).save(orderCaptor.capture());
        ProjectOrder savedOrder = orderCaptor.getValue();
        assertThat(savedOrder.getCustomer()).isNotNull();
        assertThat(savedOrder.getPaymentStatus()).isEqualTo(OrderPaymentStatus.DUE_ON_DELIVERY);
        assertThat(savedOrder.getFulfillmentStatus()).isEqualTo(OrderFulfillmentStatus.NEW);
        assertThat(savedOrder.getItems()).hasSize(1);
        assertThat(savedOrder.getItems().get(0).getLineTotal()).isEqualByComparingTo("190.00");
    }

    private Project buildProject() {
        User user = User.builder()
                .id(5L)
                .email("owner@forma.test")
                .firstName("Store")
                .lastName("Owner")
                .password("secret")
                .build();

        return Project.builder()
                .id(9L)
                .user(user)
                .name("Forma Shop")
                .type(ProjectType.ECOMMERCE)
                .creationMethod(CreationMethod.GUIDED_SETUP)
                .status(ProjectStatus.DRAFT)
                .build();
    }
}
