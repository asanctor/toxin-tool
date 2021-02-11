package vub.be.oecd.util;

import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.ResourceFactory;

/**
 * OECD Global Variables
 * Used to create the RDF/XML code, no idea why NS and why OPINION???
 * (copy/paste from Christophe's code)
 */
public class OECDVariables {
    public static final String NS = "http://ontologies.vub.be/oecd#";

    // Classes
    public static final Resource OPINION = ResourceFactory.createProperty(NS + "Opinion");
    public static final Resource REPORT = ResourceFactory.createProperty(NS + "Report");

    // Properties
    public static final Property CONTAINS = ResourceFactory.createProperty(NS + "contains");
    public static final Property ATTRIBUTE = ResourceFactory.createProperty(NS + "attribute");
    public static final Property ATTRIBUTEGROUP = ResourceFactory.createProperty(NS + "attributeGroup");
    public static final Property ORDER = ResourceFactory.createProperty(NS + "order");
    public static final Property PREDICATE = ResourceFactory.createProperty(NS + "predicate");
}
