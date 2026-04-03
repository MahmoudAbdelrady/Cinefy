package com.mdevs.cinefy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class HallType extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    public HallType() {
        if (this.name != null) {
            this.code = this.name.toLowerCase().replace(" ", "_");
        }
    }
}
