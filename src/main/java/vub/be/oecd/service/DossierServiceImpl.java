package vub.be.oecd.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vub.be.oecd.model.Dossier;
import vub.be.oecd.repository.DossierRepository;

import java.util.Optional;

@Service
public class DossierServiceImpl implements DossierService {

    @Autowired
    private DossierRepository dossierRepository;

    @Override
    public Iterable<Dossier> getAllDossiers() {
        return dossierRepository.findAll();
    }

    @Override
    public void saveDossier(Dossier dossier){
        this.dossierRepository.save(dossier);
    }

    @Override
    public Dossier getDossierById(long id) {
        Optional<Dossier> optional = dossierRepository.findById(id);
        Dossier dossier = null;
        if(optional.isPresent()){
            dossier = optional.get();
        } else {
            throw new RuntimeException("Dossier not found for id :: " + id);
        }
        return dossier;
    }

    @Override
    public void deleteDossierById(long id) {
        this.dossierRepository.deleteById(id);
    }
}
