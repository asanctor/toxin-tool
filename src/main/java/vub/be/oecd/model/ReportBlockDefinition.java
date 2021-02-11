package vub.be.oecd.model;

import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.StmtIterator;
import org.apache.jena.vocabulary.RDFS;
import vub.be.oecd.util.OECDVariables;


import java.util.ArrayList;
import java.util.List;

public class ReportBlockDefinition extends BlockDefinition {

    private static Model model = null;

    public ReportBlockDefinition(Resource resource) {
        super(resource);
    }

    private static String siblingsAsList = null;
    @Override
    public String getSiblingsAsList() {
        if(model == null) {
            model = resource.getModel();
            List<BlockDefinition> list = new ArrayList<BlockDefinition>();
            StmtIterator iter = model.listStatements(null, RDFS.subClassOf, OECDVariables.REPORT);
            while(iter.hasNext()) {
                Resource r = iter.next().getSubject();
                System.out.println("in reportBlockDefinition" + r.toString());
                BlockDefinition study = new ReportBlockDefinition(r);
                list.add(study);
            }

            List<String> x = new ArrayList<String>();
            for(BlockDefinition s : list)
                x.add("\"" + s.getType() + "\"");
            siblingsAsList = x.toString();
        }

        System.out.println("in reportBlockDefinition siblingsAsList" + siblingsAsList);
        return siblingsAsList;
    }

}