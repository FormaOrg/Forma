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
public class ProjectSalesPageDto {
    private String currencyCode;
    private SalesRangePreset rangePreset;
    private String rangeStart;
    private String rangeEndExclusive;
    private boolean compareEnabled;
    private String comparisonRangeStart;
    private String comparisonRangeEndExclusive;
    private ProjectSalesSummaryDto summary;
    private List<ProjectSalesChartPointDto> chartPoints;
    private List<ProjectSalesDeliveryStatDto> deliveryStats;
    private List<ProjectSalesTopProductDto> topProducts;
    private ProjectSalesOrdersPageDto orders;
    private boolean hasData;
}
