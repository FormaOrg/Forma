package tn.forma.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectSalesOrdersPageDto {
    private List<ProjectSalesOrderRowDto> allItems;
    private List<ProjectSalesOrderRowDto> items;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private String search;
    private SalesOrderSort sort;
    private SalesOrderFilter filter;
}
