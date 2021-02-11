package vub.be.oecd.controller;


import org.apache.commons.io.FileUtils;
import org.apache.jena.ext.com.google.common.io.Resources;
import org.apache.jena.query.Dataset;
import org.apache.jena.query.ReadWrite;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Statement;
import org.apache.jena.rdf.model.StmtIterator;
import org.apache.jena.riot.Lang;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.tdb2.TDB2Factory;
import org.apache.jena.vocabulary.RDFS;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import vub.be.oecd.model.BlockDefinition;
import vub.be.oecd.model.DomainConcept;
import vub.be.oecd.model.Dossier;
import vub.be.oecd.model.ReportBlockDefinition;
import vub.be.oecd.service.DomainConceptService;
import vub.be.oecd.service.DossierService;
import vub.be.oecd.util.OECDVariables;

import javax.xml.transform.Source;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.StringWriter;
import java.util.*;


/**
 * Naming a bit confusing but this is a controller for the index page, so it contains the dossierService as well as
 * the domainConceptService
 */
@Controller // This means that this class is a Controller
@RequestMapping(path="/") // This means URL's start with "" (after Application path)
public class DossierController {

    @Autowired
    private DossierService dossierService;

    @Autowired
    private DomainConceptService domainConceptService;

    //for the creation of Blockly blocks
    private static org.apache.jena.rdf.model.Model ontology;

    /**
     * Dossier related stuff
     * @param dossier
     * @return
     */
    @PostMapping("/saveDossier")
    public String saveDossier(@ModelAttribute("dossier") Dossier dossier){
        System.out.println("in save Dossier");
        //save dossier to database
        dossierService.saveDossier(dossier);
        return "redirect:/";
    }

    /**
     * Update Dossier and saves it to DB (and ontology?)
     * @param dossier
     * @return
     */
    @PostMapping("/updateDossier")
    public String updateDossier(@ModelAttribute("dossier") Dossier dossier){
        System.out.println("in update Dossier");
        //save dossier to database
        dossierService.saveDossier(dossier);
        rawxml = dossier.getXML();
        onSuccessFromRDFForm(dossier);
        return "redirect:/showDossierUpdatePage/" + dossier.getId();
    }


    @GetMapping("/showDossierUpdatePage/{id}")
    public String showUpdateDossierPage(@PathVariable (value = "id") long id, Model model){
        //get dossier from the service
        Dossier dossier = dossierService.getDossierById(id);
        //from christophe's code, if dossier XML is null then set default
        if(dossier.getXML() == null) {
            dossier.setXML("<xml><block type=\"OPINION\" deletable=\"false\" collapse=\"true\" movable=\"false\"><field name=\"ID\">" + dossier.getName() + "</field><field name=\"URL\">http://wise10.vub.ac.be/resource/dossier/" + dossier.getId() + "</field></block></xml>");
        }
        //set dossier as a model attribute to pre-populate the form
        model.addAttribute("dossier", dossier);

        //load the ontology
        try{
            ontology = ModelFactory.createDefaultModel();
            RDFDataMgr.read(ontology, "static/ontologie.ttl", Lang.TURTLE);
            model.addAttribute("ontology", ontology);
            System.out.println("Ontology loaded");
            model.addAttribute("rdf", rdf);
            model.addAttribute("selectedBlockType", selectedBlockType);

            //get blocks from RDFS
            List<BlockDefinition> blockDefinitions = getBlockDefinitions();
            model.addAttribute("blockDefinitions", blockDefinitions);
        } catch (Exception e){
            System.out.println("Problem loading ontology:" + e);
        }
        return "update_dossier";
    }


    /**
     * Methods from Christophe, not sure they belong in a controller...-------------------------------------------------
     * CAPITAL Comments are from christophe, left them for now...
     */

    // PROPERTIES FOR BLOCKLY
    public String getGUID() {
        return UUID.randomUUID().toString();
    }

    /**
     * The following methods allow to retrieve the list of reports from the ontology
     * These are made static so that they can be called from the controller using thymleaf [[${}]] notation
     */
    private static String reportsAsList = null;
    public static String getReportsAsList(){
        if(reportsAsList == null) {
            List<String> x = new ArrayList<String>();
            for(BlockDefinition s : getReports())
                x.add("\"" + s.getType() + "\"");
            reportsAsList = x.toString();
        }
        System.out.println("In reportAsList this is the list: " + reportsAsList);
        return reportsAsList;
    }

    public static List<BlockDefinition> getReports() {
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
     * BlockDefinitions will be converted into blockly blocks using "block_component" fragment
     * @return List of all BlockDefinitions in ontology
     */
    public List<BlockDefinition> getBlockDefinitions() {
        List<BlockDefinition> list = new ArrayList<BlockDefinition>();
        for(BlockDefinition s : getReports()) {
            list.add(s);
            list.addAll(s.getBlocks());
        }
        System.out.println("In getBlockDefinitions" + list);
        return list;
    }

    /**
     * Returns a list of block definitions only containing those of reports.
     * @return String representing a call to the fragment that will create the blockly block list of those blocks
     */
    @RequestMapping(value = "/blockDefinitionsForReports", method = RequestMethod.GET)
    public String getBlockDefinitionsForReports(Model model) {
        List<BlockDefinition> list = new ArrayList<BlockDefinition>();
        for(BlockDefinition s : getReports()) {
            list.add(s);
        }
        System.out.println("In getBlockDefinitionsForReports");
        model.addAttribute("reportBlocks", list);
        //referring to a fragment named blockDefinitionsForReportsList which is located in the results page
        return "results :: blockDefinitionsForReportsList";
    }



    private String selectedBlockType;

    /**
     * Returns a list of block definitions for the "components" part of the tool box.
     * Defaults to the reports, otherwise subcomponents based on selection. Note that
     * the template will update the tool box after a successful response.
     * @return String representing a call to the fragment that will create the blockly block list of those blocks
     */
    @RequestMapping(value = "/blockDefinitionsForChildren", method = RequestMethod.GET)
    public String getBlockDefinitionsForChildren(Model model) {
        System.out.println("In getBlockDefinitionsForChildren");
        if (selectedBlockType == null || selectedBlockType.equals("OPINION")){
            List<BlockDefinition> list = new ArrayList<BlockDefinition>();
            for(BlockDefinition s : getReports()) {
                list.add(s);
            }
            model.addAttribute("childrenBlocks", list);
            return "results :: blockDefinitionsForChildrenList";
        }

        for(BlockDefinition s : getBlockDefinitions()) {
            if (s.getType().equals(selectedBlockType)){
                List<BlockDefinition> result = s.getBlocks(false); // allTheWayDown = false -> only immediate children
                model.addAttribute("childrenBlocks", result);
                return "results :: blockDefinitionsForChildrenList";
            }

        }
        model.addAttribute("childrenBlocks", new ArrayList<BlockDefinition>());
        //referring to a fragment named blockDefinitionsForChildrenList which is located in the results page
        return "results :: blockDefinitionsForChildrenList";
    }



    @PostMapping("/blocksFromDomainConcepts")
    public @ResponseBody Map<String, List> getBlocksFromDomainConcepts(Model model) {
        System.out.println("In getBlocksFromDomainConcepts");
        Iterable<DomainConcept> DCs = domainConceptService.getAllDomainConcepts();

        //put Block JS in a list
        List<String> DCScriptList = new ArrayList<>();
        //put Block names in a list (names also represents type of the block)
        List<String> DCNameList = new ArrayList<>();
        List<String> DCTypeList = new ArrayList<>();
        for(DomainConcept dc : DCs) {
            DCScriptList.add(dc.getScript());
            DCNameList.add(dc.getName());
            DCTypeList.add(dc.getType());
        }
        Map<String, List> messageObject = new HashMap<>();
        messageObject.put("scripts", DCScriptList);
        messageObject.put("names", DCNameList);
        messageObject.put("types", DCTypeList);
        System.out.println(messageObject);

        return messageObject;
    }

    /**
     * Updates selectedBlockType
     * @return the updated type in the form of a message object {'type': type}
     */
    @PostMapping("/updateBlocks")
    public @ResponseBody Map<String, String> onUpdateBlocks(@RequestBody String type) {
        System.out.println("this is type: " + type);
        selectedBlockType = type;

        final Map<String, String> messageObject = new HashMap<>();
        messageObject.put("type", type);

        return messageObject;
    }


    private String rawxml, rdf, filestring;


    //private String assemblerfile = "data-dataset.ttl";
    void onSuccessFromRDFForm(Dossier dossier) {
        org.apache.jena.rdf.model.Model model = getModelFromXML();
        StringWriter out = new StringWriter();
        model.write(out, "TURTLE");
        rdf = out.toString();
        System.out.println("this is rdf: " + rdf);
        //TO DO: add code to render RDF in rdfArea
        //ajaxResponseRenderer.addRender(rdfArea);

        // Save Blocks in RDF format
        try {
            // rawxml is already set using getModelFromXML();
            String thexml = rawxml;
            thexml = thexml.replaceAll("\r", "").replaceAll("\n", "");

            dossier.setXML(thexml);
            //save dossier to database
            dossierService.saveDossier(dossier);

            // Ch: We have to make a copy of the assembler file...
            // A: because? no idea but ok let's do it
            File f = File.createTempFile("output", ".ttl");
            FileUtils.copyInputStreamToFile(Resources.getResource("static/data-dataset.ttl").openStream(), f);
            System.out.println("this is f: " + f.toString());

            Dataset dataset = TDB2Factory.assembleDataset(f.getAbsolutePath());
            dataset.begin(ReadWrite.WRITE);

            try {

                String URI = "<http://wise10.vub.ac.be/resource/dossier/" + dossier.getId() + ">";
                org.apache.jena.rdf.model.Model output = dataset.getNamedModel(URI);
                output.removeAll();
                output.add(model);
                dataset.commit();
            } finally {
                dataset.end();
            }
        } catch (Exception e) {
            System.out.println("Problem loading ontology: " + e.getMessage());
        }

    }

    private org.apache.jena.rdf.model.Model getModelFromXML() {
        System.out.println("this is rawxml: " + rawxml);
        org.apache.jena.rdf.model.Model m = ModelFactory.createDefaultModel();

        rawxml = rawxml.replace("xmlns=\"http://www.w3.org/1999/xhtml\"", "");


        try {
            TransformerFactory factory = TransformerFactory.newInstance();
            Source xslt = new StreamSource(Resources.getResource("static/transform.xslt").openStream());
            Transformer transformer = factory.newTransformer(xslt);
            Source text = new StreamSource(new ByteArrayInputStream(rawxml.getBytes("UTF-8")));
            File output = File.createTempFile("output", ".rdf");
            filestring = output.getAbsolutePath();
            transformer.transform(text, new StreamResult(output));

            RDFDataMgr.read(m, new FileInputStream(output), Lang.RDFXML);

            // THE XML DOESN'T KEEP TRACK OF TYPES AND THESE ARE THUS ALSO NOT APPEARING
            // IN THE RDF/XML. MANUALLY REPLACE TRIPLES WITH THEIR "TYPED" VERSIONS
            StmtIterator iter = m.listStatements();
            List<Statement> toAdd = new ArrayList<Statement>();
            List<Statement> toRemove = new ArrayList<Statement>();
            while(iter.hasNext()) {
                Statement s = iter.next();
                if(s.getObject().isLiteral()) {
                    Resource type = getTypeOfProperty(s.getPredicate());
                    if(type != null) {
                        toAdd.add(m.createStatement(
                                s.getSubject(),
                                s.getPredicate(),
                                m.createTypedLiteral(s.getObject().asLiteral().getValue(), type.getURI())));
                        toRemove.add(s);
                    }
                }
            }
            m.add(toAdd);
            m.remove(toRemove);

        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("Problem processing XML: " + e.getMessage());
        }
        System.out.println("this is m: " + m.toString());
        return m;
    }

    //should be fine...
    private Resource getTypeOfProperty(Resource property) {
        Statement s = ontology.getProperty(property, RDFS.range);
        if(s != null) return s.getObject().asResource();
        return null;
    }

    /**
     * END OF CHRISTOPHE's CODE-----------------------------------------------------------------------------------------
     */



    @GetMapping("/deleteDossier/{id}")
    public String deleteDossier(@PathVariable (value = "id") long id){
        //call delete dossier method
        this.dossierService.deleteDossierById(id);
        return  "redirect:/";
    }


    /* old method for separate new_dossier page
    @GetMapping("/showNewDossierForm")
    public String showNewDossierForm(Model model){
        //create model attribute to bind form data
        Dossier dossier = new Dossier();
        model.addAttribute("dossier", dossier);
        return "new_dossier"; //corresponds to file name!!!
    }*/

    /**
     * Get both dossiers and domain concept services for index page
     * @param model
     * @return
     */
    @GetMapping(path="/")
    public String listDossier(Model model) {
        model.addAttribute("listDossier", dossierService.getAllDossiers());
        model.addAttribute("listDomainConcept", domainConceptService.getAllDomainConcepts());
        //create model attribute to bind add dossier form data
        Dossier dossier = new Dossier();
        model.addAttribute("dossier", dossier);
        DomainConcept domainConcept = new DomainConcept();
        model.addAttribute("domainConcept", domainConcept);
        return "index";
    }


    @PostMapping("/saveDomainConcept")
    public String saveDomainConcept(@ModelAttribute("domainConcept") DomainConcept domainConcept){
        //save concept to database
        domainConceptService.saveDomainConcept(domainConcept);
        return "redirect:/";
    }


    /**
     * Update DomainConcept and saves it to DB (and ontology?)
     * @param domainConcept
     * @return

    @PostMapping("/updateDomainConcept")
    public String updateDomainConcept(@ModelAttribute("domainConcept") DomainConcept domainConcept){
        System.out.println("in update DomainConcept");
        //remove spaces and linebreaks from XML
        String rawxmlDomain = domainConcept.getXML();
        String stringXML = parseXMLToStringDomainConcept(rawxmlDomain);
        domainConcept.setXML(stringXML);

        String rawscript = domainConcept.getScript();
        rawscript = rawscript.replaceAll("\r", "").replaceAll("\n", "").replaceAll("'", "\"");
        domainConcept.setScript(rawscript);

        //save concept to database
        domainConceptService.saveDomainConcept(domainConcept);
        //onSuccessFromRDFForm(saveDomainConcept);
        return "redirect:/showDomainConceptUpdatePage/" + domainConcept.getId();
    }*/


    /**
     * Updates selectedBlockType
     * @return the updated type in the form of a message object {'type': type}
     */
    @PostMapping("/updateDomainConcept")
    public @ResponseBody Map<String, String> updateDomainConcept(@RequestBody DomainConcept domainConcept) {
        System.out.println("in update DomainConcept " + domainConcept.getName() + ", id: " + domainConcept.getId() + ", script: " + domainConcept.getScript() + ", xml: " + domainConcept.getXML());
        //remove spaces and linebreaks from XML
        String rawxmlDomain = domainConcept.getXML();
        String stringXML = parseXMLToStringDomainConcept(rawxmlDomain);
        domainConcept.setXML(stringXML);

        System.out.println("busy");
        String rawscript = domainConcept.getScript();
        rawscript = rawscript.replaceAll("\r", "").replaceAll("\n", "").replaceAll("'", "\"");
        domainConcept.setScript(rawscript);

        System.out.println("almost");
        //save concept to database
        domainConceptService.saveDomainConcept(domainConcept);
        System.out.println("done");
        //return "redirect:/showDomainConceptUpdatePage/" + domainConcept.getId();
        final Map<String, String> messageObject = new HashMap<>();
        messageObject.put("name", domainConcept.getName());

        return messageObject;
    }


    private String parseXMLToStringDomainConcept(String rawxmlDomain){
        rawxmlDomain = rawxmlDomain.replace("xmlns=\"https://developers.google.com/blockly/xml\"", "");
        rawxmlDomain = rawxmlDomain.replaceAll("\r", "").replaceAll("\n", "");
        return rawxmlDomain;
    }


   /* void onUpdateDMFromRDFForm(DomainConcept dossier) {
        org.apache.jena.rdf.model.Model model = getModelFromXML();
        StringWriter out = new StringWriter();
        model.write(out, "TURTLE");
        rdf = out.toString();
        System.out.println("this is rdf: " + rdf);
        //TO DO: add code to render RDF in rdfArea
        //ajaxResponseRenderer.addRender(rdfArea);

        // Save Blocks in RDF format
        try {
            // rawxml is already set using getModelFromXML();
            String thexml = rawxml;
            thexml = thexml.replaceAll("\r", "").replaceAll("\n", "");

            dossier.setXML(thexml);
            //save dossier to database
            dossierService.saveDossier(dossier);

            // Ch: We have to make a copy of the assembler file...
            // A: because? no idea but ok let's do it
            File f = File.createTempFile("output", ".ttl");
            FileUtils.copyInputStreamToFile(Resources.getResource("static/data-dataset.ttl").openStream(), f);
            System.out.println("this is f: " + f.toString());

            Dataset dataset = TDB2Factory.assembleDataset(f.getAbsolutePath());
            dataset.begin(ReadWrite.WRITE);

            try {

                String URI = "<http://wise10.vub.ac.be/resource/dossier/" + dossier.getId() + ">";
                org.apache.jena.rdf.model.Model output = dataset.getNamedModel(URI);
                output.removeAll();
                output.add(model);
                dataset.commit();
            } finally {
                dataset.end();
            }
        } catch (Exception e) {
            System.out.println("Problem loading ontology: " + e.getMessage());
        }

    }*/

    @GetMapping("/showDomainConceptUpdatePage/{id}")
    public String showDomainConceptUpdatePage(@PathVariable (value = "id") long id, Model model){
        //get dossier from the service
        DomainConcept domainConcept = domainConceptService.getDomainConceptById(id);

        if(domainConcept.getXML() == null) {
            System.out.println("<xml><block type=\"DOMAINCONCEPT\" deletable=\"false\" movable=\"false\"></block></xml>");
            domainConcept.setXML("<xml><block type=\"DOMAINCONCEPT\" deletable=\"false\" movable=\"false\"></block></xml>");
        }
        //set domain concept as a model attribute to pre-populate the form
        model.addAttribute("domainConcept", domainConcept);

        //load the ontology
        try{
            ontology = ModelFactory.createDefaultModel();
            RDFDataMgr.read(ontology, "static/ontologie.ttl", Lang.TURTLE);
            System.out.println("Ontology loaded");

        } catch (Exception e){
            System.out.println("Problem loading ontology:" + e);
        }
        //get blocks from RDFS => used for populating the "composed of" dropdown
        List<String> blockNames = new ArrayList<>();

        //first get reports then the blocks the report is consisting of
        for(BlockDefinition s : getReports()) {
            blockNames.add(s.getName());
            List<BlockDefinition> result = s.getBlocks(true);
            for(BlockDefinition bd : result) {
                System.out.println("Ontology loaded34 bd: " + bd.getOutputType());
                System.out.println("Ontology loaded34 bd msg: " + bd.getMessage());
                blockNames.add(bd.getMessage()); // used msg here instead of name because getName did not work for some reason...
            }
        }

        //get the created domain concepts as well
        Iterable<DomainConcept> DCs = domainConceptService.getAllDomainConcepts();
        //put Block names in a list (names also represents type of the block)
        for(DomainConcept dc : DCs) {
            blockNames.add(dc.getName());
        }


        model.addAttribute("blockNames", blockNames);
        System.out.println("in model domain: " + blockNames);


        return "update_domain_concept";
    }

    @GetMapping("/deleteDomainConcept/{id}")
    public String deleteDomainConcept(@PathVariable (value = "id") long id){
        //call delete dossier method
        this.domainConceptService.deleteDomainConceptById(id);
        return  "redirect:/";
    }

}
