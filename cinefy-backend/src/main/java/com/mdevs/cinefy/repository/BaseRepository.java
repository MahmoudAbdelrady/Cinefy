package com.mdevs.cinefy.repository;

import com.mdevs.cinefy.entity.BaseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

@NoRepositoryBean
public interface BaseRepository<T extends BaseEntity> extends JpaRepository<T, Long> {
    default T findOne(Long id) {
        return findById(id).orElse(null);
    }
}
