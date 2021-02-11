package vub.be.oecd.service;

import vub.be.oecd.model.DomainConcept;

public interface DomainConceptService {

    Iterable<DomainConcept> getAllDomainConcepts();
    void saveDomainConcept(DomainConcept domainConcept);
    DomainConcept getDomainConceptById(long id);
    void deleteDomainConceptById(long id);

}
