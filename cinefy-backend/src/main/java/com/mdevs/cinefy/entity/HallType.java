package com.mdevs.cinefy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "hall_types")
public class HallType extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;
}
