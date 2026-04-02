package com.mdevs.cinefy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "halls")
public class Hall extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private Integer occupancy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hall_type_id", nullable = false)
    private HallType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HallStatus status;

    @Override
    public void prePersist() {
        super.prePersist();
        generateCode();
    }

    @PreUpdate
    private void preUpdate() {
        generateCode();
    }

    private void generateCode() {
        if (name != null) {
            this.code = name.toLowerCase().replace(" ", "_");
        }
    }
}
