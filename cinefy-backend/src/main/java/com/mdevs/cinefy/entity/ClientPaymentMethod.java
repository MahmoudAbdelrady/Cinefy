package com.mdevs.cinefy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(indexes = @Index(columnList = "CLIENT_ID, CREATED_AT"))
public class ClientPaymentMethod extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private Client client;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private String maskedPan;

    @Column(nullable = false)
    private String cardBrand;
}
