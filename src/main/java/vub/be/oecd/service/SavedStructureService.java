package vub.be.oecd.service;

import vub.be.oecd.model.SavedStructure;

public interface SavedStructureService {

    Iterable<SavedStructure> getAllSavedStructures();
    void saveStructure(SavedStructure domainConcept);
    SavedStructure getSavedStructureById(long id);
    void deleteSavedStructureById(long id);

}
