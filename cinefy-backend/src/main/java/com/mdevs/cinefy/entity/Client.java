package com.mdevs.cinefy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class Client extends User {

    @Column(nullable = false)
    @ColumnDefault("false")
    private boolean isVerified = false;
}
