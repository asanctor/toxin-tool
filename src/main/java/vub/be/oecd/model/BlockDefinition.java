package vub.be.oecd.model;

import org.apache.jena.base.Sys;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Statement;
import org.apache.jena.rdf.model.StmtIterator;
import org.apache.jena.vocabulary.RDFS;
import vub.be.oecd.util.OECDVariables;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class BlockDefinition {

    protected Resource resource;
    protected BlockDefinition parent;

    public BlockDefinition(Resource resource) {
        this.resource = resource;
    }

    public BlockDefinition(Resource resource, BlockDefinition parent) {
        this.resource = resource;
        this.parent = parent;
    }

    public List<BlockDefinition> getBlocks() {
        return getBlocks(true);
    }

    public List<BlockDefinition> getBlocks(boolean allTheWayDown) {
        List<BlockDefinition> list = new ArrayList<BlockDefinition>();
        StmtIterator iter = resource.listProperties(OECDVariables.ATTRIBUTEGROUP);
        while(iter.hasNext()) {
            Resource r = iter.next().getObject().asResource();
            BlockDefinition attributeGroup = new BlockDefinition(r, this);
            list.add(attributeGroup);
            if(allTheWayDown)
                list.addAll(attributeGroup.getBlocks());
        }
        return list;
    }

    public String getType() {
        if(resource.getURI() == null)
            return parent.getType() + "-" + getMessage();
        return resource.getURI().toString();
    }

    public String getName() {
        System.out.println(resource + " is resource");
        return resource.getLocalName().toUpperCase();
    }

    public String getMessage() {
        if(resource.hasProperty(RDFS.label))
            return resource.getProperty(RDFS.label).getString();
        return resource.getLocalName();
    }

    public List<Attribute> getAttributes() {
        List<Attribute> list = new ArrayList<Attribute>();

        StmtIterator iter = resource.listProperties();
        List<Resource> resources = new ArrayList<Resource>();
        List<Resource> attributeGroups = new ArrayList<Resource>();
        while(iter.hasNext()) {
            Statement s = iter.next();
            if(s.getPredicate().equals(OECDVariables.ATTRIBUTE) || s.getPredicate().equals(OECDVariables.ATTRIBUTEGROUP))
                resources.add(s.getObject().asResource());

            if(s.getPredicate().equals(OECDVariables.ATTRIBUTEGROUP))
                attributeGroups.add(s.getObject().asResource());
        }

        resources.sort(new Comparator<Resource>() {
            @Override
            public int compare(Resource o1, Resource o2) {
                String order1 = o1.hasProperty(OECDVariables.ORDER) ? o1.getProperty(OECDVariables.ORDER).getObject().toString() : "";
                String order2 = o2.hasProperty(OECDVariables.ORDER) ? o2.getProperty(OECDVariables.ORDER).getObject().toString() : "";
                return order1.compareTo(order2);
            }
        });

        int num = 1;
        for(Resource resource : resources) {
            if(attributeGroups.contains(resource)) {
                list.add(new GroupAttribute(resource, new BlockDefinition(resource, this).getType(), num++));
            } else {
                list.add(new SimpleAttribute(resource, num++));
            }
        }

        return list;
    }

    public String getSiblingsAsList(){
        return null;
    }

    public String getOutputType() {
        return "\"" + getType() + "\"";
    }

    public int getHeu() {
        return Math.abs(getType().hashCode()) % 360;
    }

}