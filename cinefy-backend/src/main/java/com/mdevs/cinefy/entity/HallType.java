package com.mdevs.cinefy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(indexes = {
        @Index(columnList = "CODE"),
        @Index(columnList = "_UUID")
})
public class HallType extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    public HallType(String name) {
        this.name = name;
        this.code = toCode(name);
    }

    public static String toCode(String name) {
        return name.toLowerCase().replace(" ", "_");
    }
}
