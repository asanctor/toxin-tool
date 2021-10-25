package vub.be.oecd.model;

import javax.persistence.*;

@Entity
@Table(name = "saved_structure")
public class SavedStructure {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    private String name;
    //Type can be either report or component
    private String type;
    //XML stores the values selected by the user for in the domain concept block in the main workspace
    private String XML;
    //JS stores the JavaScript code to generate the created domain concept block (should be used in manage dossiers)
    private String script;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getXML() {
        return XML;
    }

    public void setXML(String XML) {
        this.XML = XML;
    }

    public String getScript() {
        return script;
    }

    public void setScript(String script) {
        this.script = script;
    }
}
