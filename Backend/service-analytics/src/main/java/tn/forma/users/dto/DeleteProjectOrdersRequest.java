package tn.forma.users.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class DeleteProjectOrdersRequest {

    @NotEmpty
    private List<@NotNull Long> orderIds;
}
