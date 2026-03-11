package com.produtos.api.repository;

import com.produtos.api.model.ComandaItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComandaItemRepository extends JpaRepository<ComandaItem, Long> {
    List<ComandaItem> findByComandaId(Long comandaId);
}
