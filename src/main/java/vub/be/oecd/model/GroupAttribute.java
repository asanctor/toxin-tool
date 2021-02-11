package vub.be.oecd.model;

import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDFS;

/**
 * GroupAttribute
 * Used for creating the right fields in Blockly
 * (copy/paste from Christophe's code for now)
 */
public class GroupAttribute extends Attribute {

    private Resource resource;
    private String inputTypeName;

    public GroupAttribute(Resource resource, String inputTypeName, int order) {
        super(order);
        this.resource = resource;
        this.inputTypeName = inputTypeName;
        System.out.println("creating group attribute");
    }

    @Override
    public String getType() {
        return "input_value";
    }

    @Override
    public String getName() {
        return getMessage();
    }

    @Override
    public String getMessage() {
        if(resource.hasProperty(RDFS.label))
            return resource.getProperty(RDFS.label).getString();
        return null;
    }

    @Override
    public String getInputType() {
        return "\"" + inputTypeName + "\"";
    }

    @Override
    public String getOtherAttributes() {
        return "";
    }

}