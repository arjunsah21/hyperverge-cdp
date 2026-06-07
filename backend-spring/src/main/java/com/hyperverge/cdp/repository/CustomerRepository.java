package com.hyperverge.cdp.repository;

import com.hyperverge.cdp.domain.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long>, JpaSpecificationExecutor<Customer> {
    boolean existsByEmail(String email);

    Optional<Customer> findByEmail(String email);

    @Query("select distinct c.state from Customer c where c.state is not null order by c.state")
    List<String> findDistinctStates();

    @Query("select distinct c.source from Customer c where c.source is not null order by c.source")
    List<String> findDistinctSources();
}
