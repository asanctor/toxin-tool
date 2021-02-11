package vub.be.oecd.service;

import vub.be.oecd.model.Dossier;

public interface DossierService {

    Iterable<Dossier> getAllDossiers();
    void saveDossier(Dossier dossier);
    Dossier getDossierById(long id);
    void deleteDossierById(long id);

}
