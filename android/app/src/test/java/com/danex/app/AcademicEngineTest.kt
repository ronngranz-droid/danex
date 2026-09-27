package com.danex.app

import com.danex.app.core.academic.McqExtractor
import com.danex.app.ui.components.ScientificFormatter
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AcademicEngineTest {

    @Test
    fun testStandardMcqExtractionAtoE() {
        val raw = """
            Organel sel manakah yang berfungsi sebagai respirasi seluler?
            A. Nukleus
            B. Ribosom
            C. Mitokondria
            D. Lisosom
            E. Sentriol
        """.trimIndent()

        val parsed = McqExtractor.extractMcq(raw)
        assertTrue(parsed.isComplete)
        assertEquals(5, parsed.options.size)
        assertEquals("Organel sel manakah yang berfungsi sebagai respirasi seluler?", parsed.questionBody)
        assertEquals("A", parsed.options[0].key)
        assertEquals("Nukleus", parsed.options[0].text)
        assertEquals("C", parsed.options[2].key)
        assertEquals("Mitokondria", parsed.options[2].text)
        assertEquals("E", parsed.options[4].key)
        assertEquals("Sentriol", parsed.options[4].text)
    }

    @Test
    fun testStandardMcqExtractionAtoD() {
        val raw = """
            Berapa hasil dari 12 x 8?
            A) 84
            B) 96
            C) 104
            D) 108
        """.trimIndent()

        val parsed = McqExtractor.extractMcq(raw)
        assertTrue(parsed.isComplete)
        assertEquals(4, parsed.options.size)
        assertEquals("B", parsed.options[1].key)
        assertEquals("96", parsed.options[1].text)
    }

    @Test
    fun testNumericOptionsNormalizedToLetters() {
        val raw = """
            Ibu kota negara Indonesia adalah:
            1. Surabaya
            2. Bandung
            3. Jakarta
            4. Medan
        """.trimIndent()

        val parsed = McqExtractor.extractMcq(raw)
        assertTrue(parsed.isComplete)
        assertEquals(4, parsed.options.size)
        assertEquals("A", parsed.options[0].key)
        assertEquals("Surabaya", parsed.options[0].text)
        assertEquals("C", parsed.options[2].key)
        assertEquals("Jakarta", parsed.options[2].text)
    }

    @Test
    fun testInlineMcqExtraction() {
        val raw = "Di mana letak DNA? A. Nukleus B. Sitoplasma C. Membran D. Dinding"
        val parsed = McqExtractor.extractMcq(raw)
        assertTrue(parsed.isComplete)
        assertEquals(4, parsed.options.size)
        assertEquals("A", parsed.options[0].key)
        assertEquals("Nukleus", parsed.options[0].text)
        assertEquals("B", parsed.options[1].key)
        assertEquals("Sitoplasma", parsed.options[1].text)
    }

    @Test
    fun testIncompleteMcqDetected() {
        // Only 1 option provided
        val raw = """
            Soal ujian terpotong:
            A. Opsi tunggal
        """.trimIndent()

        val parsed = McqExtractor.extractMcq(raw)
        assertFalse(parsed.isComplete)
        assertTrue(parsed.confidence < 0.6f)
    }

    @Test
    fun testScientificFormatterChemicalFormula() {
        val h2o = ScientificFormatter.formatChemicalFormula("H2O")
        assertEquals("H₂O", h2o)

        val co2 = ScientificFormatter.formatChemicalFormula("CO2")
        assertEquals("CO₂", co2)

        val h2so4 = ScientificFormatter.formatChemicalFormula("H2SO4")
        assertEquals("H₂SO₄", h2so4)

        val reaction = ScientificFormatter.formatChemicalFormula("2H2 + O2 -> 2H2O")
        assertEquals("2H₂ + O₂ → 2H₂O", reaction)
    }

    @Test
    fun testScientificFormatterPhysicsUnits() {
        val text = "Percepatan mobil adalah 5 m/s^2"
        val formatted = ScientificFormatter.formatScientificNotation(text)
        assertEquals("Percepatan mobil adalah 5 m/s²", formatted)
    }
}
