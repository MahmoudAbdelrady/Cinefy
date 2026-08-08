package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.entity.enums.PaymentProvider;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(indexes = {
        @Index(columnList = "ACTIVE"),
        @Index(columnList = "CREATED_AT"),
        @Index(columnList = "DELETED_AT")
})
public class PaymentGateway extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentProvider provider;

    @Column(nullable = false)
    private boolean active = false;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String credentials;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSONB")
    private String paymentChannels;

    @Column(columnDefinition = "TIMESTAMP(0)")
    private LocalDateTime deletedAt;

    public static String toCode(String name) {
        return name.trim().toLowerCase().replace(" ", "_");
    }
}
