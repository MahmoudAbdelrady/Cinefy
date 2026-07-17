package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.dto.hall.HallLayout;
import com.mdevs.cinefy.entity.enums.HallStatus;
import com.mdevs.cinefy.entity.enums.SeatCategory;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(indexes = {
        @Index(columnList = "TYPE_ID"),
        @Index(columnList = "STATUS"),
        @Index(columnList = "CREATED_AT")
})
public class Hall extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private int totalRows = 0;

    @Column(nullable = false)
    private int totalColumns = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HallStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private HallType type;

    @Column(nullable = false)
    private boolean supports3D = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSONB", nullable = false)
    private HallLayout layout = new HallLayout(Map.of(), List.of());

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSONB", nullable = false)
    private Map<SeatCategory, BigDecimal> categoryPrices = Map.of();

    public Hall(String name) {
        this.name = name;
        if (this.name != null) {
            this.code = toCode(this.name);
        }
    }

    public int getCapacity() {
        int aisleSeats = layout.categories().getOrDefault(SeatCategory.AISLE, List.of()).size();
        return totalRows * totalColumns - aisleSeats;
    }

    public static String toCode(String name) {
        return name.trim().toLowerCase().replace(" ", "_");
    }
}
