<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
	xmlns:ont="http://ontologies.vub.be/oecd#" xmlns:dcterms="http://purl.org/dc/terms/">

	<xsl:template match="/">
		<rdf:RDF>
			<xsl:apply-templates />
		</rdf:RDF>
	</xsl:template>

	<xsl:template match="block[@type='OPINION']">
		<rdf:Description rdf:about="{./field[@name='URL']}">
			<rdf:type rdf:resource="http://ontologies.vub.be/oecd#Opinion" />
			<dcterms:identifier>
				<xsl:value-of select="./field[@name='ID']" />
			</dcterms:identifier>
			<dcterms:source>
				<xsl:value-of select="./field[@name='PUBLICATION']" />
			</dcterms:source>

			<xsl:for-each
				select="./statement[@name='REPORTS']/block | ./statement[@name='REPORTS']//next/block">
				<ont:contains>
					<rdf:Description>
						<rdf:type rdf:resource="http://ontologies.vub.be/oecd#Report" />
						<rdf:type rdf:resource="{@type}" />

						<xsl:for-each select=".//field">
							<xsl:if test="not(./text() = 'undefined')">
								<xsl:element name="ont:{substring-after(@name,'#')}">
									<xsl:attribute name="rdf:datatype">http://www.w3.org/2001/XMLSchema#string</xsl:attribute>
									<xsl:value-of select="./text()" />
								</xsl:element>
							</xsl:if>
						</xsl:for-each>

					</rdf:Description>
				</ont:contains>
			</xsl:for-each>

		</rdf:Description>
	</xsl:template>

	<xsl:template match="text()" />

</xsl:stylesheet>