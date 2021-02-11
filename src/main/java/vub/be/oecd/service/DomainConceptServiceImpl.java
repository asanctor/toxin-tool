package vub.be.oecd.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vub.be.oecd.model.DomainConcept;
import vub.be.oecd.repository.DomainConceptRepository;

import java.util.Optional;

@Service
public class DomainConceptServiceImpl implements DomainConceptService{

    @Autowired
    private DomainConceptRepository domainConceptRepository;

    @Override
    public Iterable<DomainConcept> getAllDomainConcepts() {
        return domainConceptRepository.findAll();
    }

    @Override
    public void saveDomainConcept(DomainConcept domainConcept) {
        this.domainConceptRepository.save(domainConcept);
    }

    @Override
    public DomainConcept getDomainConceptById(long id) {
        Optional<DomainConcept> optional = domainConceptRepository.findById(id);
        DomainConcept domainConcept = null;
        if(optional.isPresent()){
            domainConcept = optional.get();
        } else {
            throw new RuntimeException("Domain concept not found for id :: " + id);
        }
        return domainConcept;
    }

    @Override
    public void deleteDomainConceptById(long id) {
        this.domainConceptRepository.deleteById(id);
    }
}
