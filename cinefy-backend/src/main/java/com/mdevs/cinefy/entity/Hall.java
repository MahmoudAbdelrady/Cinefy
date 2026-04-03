package com.mdevs.cinefy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    private HallType type;

    @Column(nullable = false)
    private boolean supports3D = false;

    @OneToMany(mappedBy = "hall", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HallCategoryPrice> categoryPrices = new ArrayList<>();

    public Hall(String name) {
        this.name = name;
        if (this.name != null) {
            this.code = toCode(this.name);
        }
    }

    public static String toCode(String name) {
        return name.toLowerCase().replace(" ", "_");
    }
}
