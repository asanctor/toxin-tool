package vub.be.oecd.model;

import javax.persistence.*;

/**
 * Study
 * No idea why and how this is used
 * (copy/paste from Christophe's code)
 */
@Entity
@Table(name = "study")
public class Study {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    private String label;
    private String url;
    private String XML;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getXML() {
        return XML;
    }

    public void setXML(String XML) {
        this.XML = XML;
    }
}
