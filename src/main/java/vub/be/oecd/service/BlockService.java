package vub.be.oecd.service;

import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.StmtIterator;
import org.apache.jena.vocabulary.RDFS;
import org.springframework.stereotype.Service;
import vub.be.oecd.model.BlockDefinition;
import vub.be.oecd.model.ReportBlockDefinition;
import vub.be.oecd.util.OECDVariables;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BlockService {

    // PROPERTIES FOR BLOCKLY
    public String getGUID() {
        return UUID.randomUUID().toString();
    }

    private  String reportsAsList = null;
    public  String getReportsAsList(org.apache.jena.rdf.model.Model ontology){
        if(reportsAsList == null) {
            List<String> x = new ArrayList<String>();
            for(BlockDefinition s : getReports(ontology))
                x.add("\"" + s.getType() + "\"");
            reportsAsList = x.toString();
        }
        System.out.println("In reportAsList this is the list: " + reportsAsList);
        return reportsAsList;
    }

    public List<BlockDefinition> getReports(org.apache.jena.rdf.model.Model ontology) {
        List<BlockDefinition> list = new ArrayList<BlockDefinition>();
        StmtIterator iter = ontology.listStatements(null, RDFS.subClassOf, OECDVariables.REPORT);
        while(iter.hasNext()) {
            Resource r = iter.next().getSubject();
            BlockDefinition report = new ReportBlockDefinition(r);
            list.add(report);
        }
        return list;
    }


    // SHARE PROPERTY FOR THE BLOCKDEFINITIONLISTS
    private BlockDefinition blockDefinition;

    /**
     * Returns a complete list of block definitions. This one is necessary
     * to load all block definitions in the client.
     * @return
     */
    public List<BlockDefinition> getBlockDefinitions(org.apache.jena.rdf.model.Model ontology) {
        List<BlockDefinition> list = new ArrayList<BlockDefinition>();
        for(BlockDefinition s : getReports(ontology)) {
            list.add(s);
            list.addAll(s.getBlocks());
        }
        return list;
    }

    /**
     * Returns a list of block definitions only containing those of reports.
     * @return
     */
    public List<BlockDefinition> getBlockDefinitionsForReports(org.apache.jena.rdf.model.Model ontology) {
        List<BlockDefinition> list = new ArrayList<BlockDefinition>();
        for(BlockDefinition s : getReports(ontology)) {
            list.add(s);
        }
        return list;
    }

    private String selectedBlockType;

    /**
     * Returns a list of block definitions for the "components" part of the tool box.
     * Defaults to the reports, otherwise subcomponents based on selection. Note that
     * the template will update the tool box after a successful response.
     * @return
     */
    public List<BlockDefinition> getBlockDefinitionsForChildren(org.apache.jena.rdf.model.Model ontology) {
        if (selectedBlockType == null || selectedBlockType.equals("OPINION"))
            return getBlockDefinitionsForReports(ontology);

        for(BlockDefinition s : getBlockDefinitions(ontology)) {
            if (s.getType().equals(selectedBlockType))
                return s.getBlocks(false); // allTheWayDown = false -> only immediate children
        }

        return new ArrayList<BlockDefinition>();
    }

    /**
     * Updates selected blocktype
     * @return void
     */
    public void onUpdateBlocks(String type) {
        System.out.println("this is type " + type);
        selectedBlockType = type;
    }
}
