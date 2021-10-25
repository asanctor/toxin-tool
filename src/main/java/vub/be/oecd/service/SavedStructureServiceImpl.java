package vub.be.oecd.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vub.be.oecd.model.SavedStructure;
import vub.be.oecd.repository.SavedStructureRepository;

import java.util.Optional;

@Service
public class SavedStructureServiceImpl implements SavedStructureService {

    @Autowired
    private SavedStructureRepository savedStructureRepository;

    @Override
    public Iterable<SavedStructure> getAllSavedStructures() {
        return savedStructureRepository.findAll();
    }

    @Override
    public void saveStructure(SavedStructure savedStructure) {
        this.savedStructureRepository.save(savedStructure);
    }

    @Override
    public SavedStructure getSavedStructureById(long id) {
        Optional<SavedStructure> optional = savedStructureRepository.findById(id);
        SavedStructure savedStructure = null;
        if(optional.isPresent()){
            savedStructure = optional.get();
        } else {
            throw new RuntimeException("Saved Structure not found for id :: " + id);
        }
        return savedStructure;
    }

    @Override
    public void deleteSavedStructureById(long id) {
        this.savedStructureRepository.deleteById(id);
    }
}
