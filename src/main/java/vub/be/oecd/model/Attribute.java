package vub.be.oecd.model;

/**
 * Abstract class of Attribute, used by SimpleAttribute and GroupAttribute
 * Used for creating the right fields in Blockly
 * (copy/paste from Christophe's code for now)
 */
public abstract class Attribute {

    private int order;

    public Attribute(int order) {
        this.order = order;
    }

    public int getOrder() {
        return order;
    }

    abstract public String getType();
    abstract public String getName();
    abstract public String getMessage();
    abstract public String getInputType();
    abstract public String getOtherAttributes();
}
