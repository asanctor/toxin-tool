package vub.be.oecd.repository;

// This will be AUTO IMPLEMENTED by Spring into a Bean called userRepository
// CRUD refers Create, Read, Update, Delete

import org.springframework.data.repository.CrudRepository;
import vub.be.oecd.model.Dossier;


public interface DossierRepository extends CrudRepository<Dossier, Long> {

}