package org.studyplant.mystudyplant.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.studyplant.mystudyplant.entity.User;


public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
    User findByUsernameOrEmail(String username,String email);
    User findByEmail(String email);
     Page<User> findByUsernameContainingOrEmailContaining(String username, String email, Pageable pageable);
}


