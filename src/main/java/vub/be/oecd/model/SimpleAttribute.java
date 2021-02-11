package vub.be.oecd.model;

import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Statement;
import org.apache.jena.vocabulary.RDFS;
import org.apache.jena.vocabulary.XSD;

import java.util.ArrayList;
import java.util.List;

import vub.be.oecd.util.OECDVariables;

/**
 * SimpleAttribute
 * Used for creating the right fields in Blockly
 * (copy/paste from Christophe's code + own changes for extra property types)
 */
public class SimpleAttribute extends Attribute {

    private Resource predicate;

    public SimpleAttribute(Resource resource, int order) {
        super(order);
        predicate = resource.getProperty(OECDVariables.PREDICATE).getObject().asResource();
        //System.out.println("new SimpleAttribute created: " + predicate.toString());
    }

    @Override
    public String getType() {
        if(predicate.hasProperty(RDFS.range)) {
            System.out.println("predicate:" + predicate);
            System.out.println("predicateProp:" + predicate.getPropertyResourceValue(RDFS.range).toString());

            if(XSD.dateTime.equals(predicate.getProperty(RDFS.range).getObject())){
                System.out.println("predicateprop:" + predicate.getProperty(RDFS.range));
                return "field_date";}
            if(XSD.xboolean.equals(predicate.getProperty(RDFS.range).getObject())){
                System.out.println("predicateProp:" + predicate.getProperty(RDFS.range).getObject());
                return "field_checkbox";}
            if(XSD.integer.equals(predicate.getProperty(RDFS.range).getObject()))
                return "field_number";
            if(XSD.xint.equals(predicate.getProperty(RDFS.range).getObject()))
                return "field_number";
            if(XSD.xdouble.equals(predicate.getProperty(RDFS.range).getObject()))
                return "field_number";
            if(XSD.positiveInteger.equals(predicate.getProperty(RDFS.range).getObject()))
                return "field_number";
            if(XSD.xlong.equals(predicate.getProperty(RDFS.range).getObject()))
                return "field_number";
            if(XSD.xfloat.equals(predicate.getProperty(RDFS.range).getObject()))
                return "field_number";
            if(XSD.anyURI.equals(predicate.getProperty(RDFS.range).getObject())) {
                System.out.println("URI");
                System.out.println("predicateProp:" + predicate.getProperty(RDFS.range).getObject());
                return "field_input";
            }
            if(predicate.getPropertyResourceValue(RDFS.range).toString().contains("colour")) {
                System.out.println("predicateProp:" + predicate.getProperty(RDFS.range).getObject());
                return "field_colour";
            }
            if(predicate.getPropertyResourceValue(RDFS.range).toString().contains("angle")) {
                System.out.println("predicateProp:" + predicate.getProperty(RDFS.range).getObject());
                return "field_angle";
            }
            if(predicate.getPropertyResourceValue(RDFS.range).toString().contains("dropdown")) {
                System.out.println("predicateProp:" + predicate.getProperty(RDFS.range).getObject());
                System.out.println("--predicateLabel:" + predicate.listProperties().toList());
                return "field_dropdown";
            }

        }
        return "field_input";	//corresponds to blockly type for text input: https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/text-input!
        //unused built-in field types are: field_angle, field_colour, field_dropdown, field_image, field_variable
    }

    public String getOtherAttributes() {
        if(predicate.hasProperty(RDFS.range)) {
            if(XSD.integer.equals(predicate.getProperty(RDFS.range).getObject()))
                return ", \"precision\": 1";
            if(XSD.xint.equals(predicate.getProperty(RDFS.range).getObject()))
                return ", \"precision\": 1";
            if(XSD.positiveInteger.equals(predicate.getProperty(RDFS.range).getObject()))
                return ", \"precision\": 1, \"min\": 1";
            if(XSD.xlong.equals(predicate.getProperty(RDFS.range).getObject()))
                return ", \"precision\": 1";
            //if(XSD.anyURI.equals(predicate.getProperty(RDFS.range).getObject()))
            //	return ", \"src\": " + "http://";
            if(predicate.getPropertyResourceValue(RDFS.range).toString().contains("dropdown")){
                List<String> options = new ArrayList<String>();
                List<Statement> statements = predicate.listProperties().toList();
                System.out.println("list:" + statements + statements.size());
                for(int i = 0; i<statements.size(); i++){
                    System.out.println("in group stat:" + statements.get(i).toString());
                    if(statements.get(i).toString().contains("option_group")){
                        String option = statements.get(i).getObject().asResource().getProperty(RDFS.label).toString();
                        int index = option.indexOf('"')+1;
                        int endIndex = option.length()-2;
                        String newOption = option.substring(index, endIndex);
                        System.out.println("in option:" + option);
                        options.add("['" + newOption + "', '"+ newOption + "']");
                    }
                }
                System.out.println("in options:" + options);
                return ", \"options\": " + options;
            }

        }

        return "";
    }

    @Override
    public String getName() {
        return predicate.toString();
    }

    @Override
    public String getMessage() {
        if(predicate.hasProperty(RDFS.label))
            return predicate.getProperty(RDFS.label).getString();
        return predicate.getLocalName();
    }

    @Override
    public String getInputType() {
        if(predicate.hasProperty(RDFS.range)) {
//			if(XSD.integer.equals(predicate.getProperty(RDFS.range).getObject()))
//				return "\"Number\"";
//			if(XSD.xint.equals(predicate.getProperty(RDFS.range).getObject()))
//				return "\"Number\"";
//			if(XSD.xdouble.equals(predicate.getProperty(RDFS.range).getObject()))
//				return "\"Number\"";
//			if(XSD.positiveInteger.equals(predicate.getProperty(RDFS.range).getObject()))
//				return "\"Number\"";
//			if(XSD.xlong.equals(predicate.getProperty(RDFS.range).getObject()))
//				return "\"Number\"";
//			if(XSD.xfloat.equals(predicate.getProperty(RDFS.range).getObject()))
//				return "\"Number\"";
//			if(XSD.xboolean.equals(predicate.getProperty(RDFS.range).getObject()))
//				return "\"Boolean\"";
//			if(XSD.xstring.equals(predicate.getProperty(RDFS.range).getObject()))
//				return "\"String\"";
//			if(RDFS.Literal.equals(predicate.getProperty(RDFS.range).getObject()))
//				return "\"String\"";
        }
        return "null";
    }

}
