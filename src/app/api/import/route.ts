import { analyzeTranscript } from "@/lib/interview-analysis";
import { validateRecordInput } from "@/lib/record-validation";
import { NextRequest, NextResponse } from "next/server";
import {
  analyzeSentiment,
  extractKeywords,
  detectThemes,
  classifyInsight,
  classifyAssumption,
  scoreOpportunity,
} from "@/lib/analysis";
import { createRecord, generateId } from "@/lib/storage";
import type {
  Insight,
  Opportunity,
  Persona,
  Feature,
  Assumption,
  Priority,
  Interview,
  Experiment,
} from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

type ExtractedItem =
  | { type: "interview"; data: Interview }
  | { type: "experiment"; data: Experiment }
  | { type: "insight"; data: Insight }
  | { type: "opportunity"; data: Opportunity }
  | { type: "persona"; data: Persona }
  | { type: "feature"; data: Feature }
  | { type: "assumption"; data: Assumption };

function parseTextIntoSections(text: string): { section: string; content: string }[] {
  const sections: { section: string; content: string }[] = [];
  const lines = text.split("\n");

  let currentSection = "General";
  let currentContent: string[] = [];

  for (const line of lines) {
    const sectionMatch = line.match(/^#{1,3}\s+(.+)$/) || line.match(/^([A-Z][A-Za-z\s]{2,40}):$/);
    if (sectionMatch) {
      if (currentContent.length > 0) {
        sections.push({ section: currentSection, content: currentContent.join("\n").trim() });
      }
      currentSection = sectionMatch[1].toLowerCase().trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    sections.push({ section: currentSection, content: currentContent.join("\n").trim() });
  }

  return sections;
}

function detectParagraphType(text: string): string[] {
  const types: string[] = [];
  const lower = text.toLowerCase();

  if (/\b(frustrat|annoy|difficult|hard|problem|pain|struggle|hate|broken|bug|issue|complaint|can't|cannot|doesn't work|slow|confus)\b/i.test(lower)) {
    types.push("pain_point");
  }
  if (/\b(want|need|would like|feature request|wish|should have|add|build|create|implement|feature)\b/i.test(lower)) {
    types.push("feature_request");
  }
  if (/\b(opportunity|could|potential|market|gap|unmet need)\b/i.test(lower)) {
    types.push("opportunity");
  }
  if (/\b(assume|assumption|think|believe|probably|maybe|guess|hypothesis)\b/i.test(lower)) {
    types.push("assumption");
  }
  if (/\b(us persona|user type|role|demographic|goal|job to be done|jTbd)\b/i.test(lower)) {
    types.push("persona");
  }

  return types.length > 0 ? types : ["insight"];
}

function extractPersonaCandidates(sections: { section: string; content: string }[]): Partial<Persona>[] {
  const personas: Partial<Persona>[] = [];
  const personaKeywords = ["persona", "role", "user type", "user persona", "demographic", "who is", "target user"];

  for (const section of sections) {
    const combined = `${section.section} ${section.content}`.toLowerCase();
    if (personaKeywords.some((k) => combined.includes(k))) {
      const nameMatch = section.content.match(/(?:name|persona|role)[:\s]+([^\n]+)/i);
      const roleMatch = section.content.match(/(?:role|title|position)[:\s]+([^\n]+)/i);
      const goalsMatch = section.content.match(/(?:goals?)[:\s]*\n?((?:(?:[-*]\s*[^\n]+)\n?)+)/i);
      const frustrationsMatch = section.content.match(/(?:frustrations?|pain points?|challenges?)[:\s]*\n?((?:(?:[-*]\s*[^\n]+)\n?)+)/i);
      const behaviorsMatch = section.content.match(/(?:behaviors?|habits?|does)[:\s]*\n?((?:(?:[-*]\s*[^\n]+)\n?)+)/i);
      const needsMatch = section.content.match(/(?:needs?|requirements?|looking for)[:\s]*\n?((?:(?:[-*]\s*[^\n]+)\n?)+)/i);
      const jtbdMatch = section.content.match(/(?:jobs? to be done|jtbd)[:\s]*\n?((?:(?:[-*]\s*[^\n]+)\n?)+)/i);

      const parseList = (match: RegExpMatchArray | null): string[] => {
        if (!match) return [];
        return match[1].split("\n").map((l) => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
      };

      const name = nameMatch ? nameMatch[1].trim() : section.section.replace(/\bpersona\b/i, "").trim() || "Unnamed Persona";
      const role = roleMatch ? roleMatch[1].trim() : "";

      personas.push({
        name,
        role,
        demographics: "",
        goals: parseList(goalsMatch),
        frustrations: parseList(frustrationsMatch),
        behaviors: parseList(behaviorsMatch),
        needs: parseList(needsMatch),
        quotes: [],
        jobsToBeDone: parseList(jtbdMatch),
      });
    }
  }

  return personas;
}

function extractBulletList(text: string): string[] {
  const lines = text.split("\n").filter((l) => l.trim());
  const bullets = lines.filter((l) => /^[-*•]\s/.test(l.trim()));
  if (bullets.length === 0) return [];
  return bullets.map((b) => b.replace(/^[-*•]\s+/, "").trim()).filter(Boolean);
}

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 30);
}

function extractFromText(text: string): ExtractedItem[] {
  const items: ExtractedItem[] = [];
  const sections = parseTextIntoSections(text);

  const personaCandidates = extractPersonaCandidates(sections);
  for (const candidate of personaCandidates) {
    if (candidate.goals?.length || candidate.frustrations?.length || candidate.needs?.length) {
      const persona: Persona = {
        id: generateId(),
        name: candidate.name || "Unnamed Persona",
        role: candidate.role || "",
        demographics: candidate.demographics || "",
        goals: candidate.goals || [],
        frustrations: candidate.frustrations || [],
        behaviors: candidate.behaviors || [],
        needs: candidate.needs || [],
        quotes: candidate.quotes || [],
        jobsToBeDone: candidate.jobsToBeDone || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      items.push({ type: "persona", data: persona });
    }
  }

  for (const section of sections) {
    if (/interview|transcript/i.test(section.section) && section.content.trim()) {
      const now = new Date().toISOString();
      items.push({ type: "interview", data: {
        id: generateId(), title: section.section, transcript: section.content,
        interviewee: "", date: now.slice(0, 10), analysis: analyzeTranscript(section.content),
        tags: extractKeywords(section.content), createdAt: now, updatedAt: now,
      } });
    }
    if (/experiment|hypothesis|test plan/i.test(section.section) && section.content.trim()) {
      const now = new Date().toISOString();
      items.push({ type: "experiment", data: {
        id: generateId(), title: `Draft: ${section.content.slice(0, 70).replace(/\n/g, " ")}`,
        hypothesis: section.content, metrics: { successMetric: "", failureMetric: "" },
        duration: "", cost: "", risk: "medium", expectedLearning: "Review the source hypothesis and define success criteria before running.",
        status: "planned", relatedAssumptionIds: [], createdAt: now, updatedAt: now,
      } });
    }
    const paragraphs = splitIntoParagraphs(section.content);
    if (paragraphs.length === 0 && section.content.trim().length > 30) {
      paragraphs.push(section.content.trim());
    }

    for (const paragraph of paragraphs) {
      const types = detectParagraphType(paragraph);

      {
        const keywords = extractKeywords(paragraph);
        const themes = detectThemes(paragraph);
        const sentiment = analyzeSentiment(paragraph);
        const category = classifyInsight(paragraph);

        const insight: Insight = {
          id: generateId(),
          title: paragraph.slice(0, 80).replace(/\n/g, " "),
          description: paragraph,
          source: "other",
          category,
          emotion: sentiment,
          tags: keywords,
          themes,
          quotes: [],
          priority: sentiment === "negative" ? "high" : sentiment === "mixed" ? "medium" : "low",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        items.push({ type: "insight", data: insight });
      }

      if (types.includes("opportunity")) {
        const keywords = extractKeywords(paragraph);
        const scores = {
          impact: Math.min(10, Math.max(1, Math.ceil(keywords.length / 2))),
          frequency: 5,
          urgency: 5,
          businessValue: 5,
          strategicAlignment: 5,
          confidence: 5,
        };
        const scored = scoreOpportunity(scores);

        const opportunity: Opportunity = {
          id: generateId(),
          title: paragraph.slice(0, 80).replace(/\n/g, " "),
          description: paragraph,
          scores,
          totalScore: scored.totalScore,
          priority: scored.priority,
          reasoning: scored.reasoning,
          relatedInsightIds: [],
          status: "new",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        items.push({ type: "opportunity", data: opportunity });
      }

      if (types.includes("assumption")) {
        const riskMap: Record<string, Assumption["risk"]> = { negative: "high", mixed: "medium", neutral: "medium", positive: "low" };
        const sentiment = analyzeSentiment(paragraph);

        const assumption: Assumption = {
          id: generateId(),
          statement: paragraph.slice(0, 200).replace(/\n/g, " "),
          area: classifyAssumption(paragraph),
          risk: riskMap[sentiment] || "medium",
          evidence: "",
          validationStatus: "untested",
          relatedExperimentIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        items.push({ type: "assumption", data: assumption });
      }

      if (types.includes("feature_request")) {
        const keywords = extractKeywords(paragraph);
        const priority: Priority =
          keywords.length >= 5 ? "high" : keywords.length >= 3 ? "medium" : "low";

        const feature: Feature = {
          id: generateId(),
          title: paragraph.slice(0, 80).replace(/\n/g, " "),
          description: paragraph,
          framework: "rice",
          scores: {
            reach: 5,
            impact: Math.min(10, keywords.length),
            confidence: 5,
            effort: 5,
          },
          totalScore: Math.min(10, keywords.length),
          priority,
          status: "backlog",
          relatedOpportunityIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        items.push({ type: "feature", data: feature });
      }
    }

    const bullets = extractBulletList(section.content);
    for (const bullet of bullets) {
      if (bullet.length < 20) continue;
      const types = detectParagraphType(bullet);
      const keywords = extractKeywords(bullet);
      const sentiment = analyzeSentiment(bullet);
      const category = classifyInsight(bullet);

      {
        const insight: Insight = {
          id: generateId(),
          title: bullet.slice(0, 80),
          description: bullet,
          source: "other",
          category,
          emotion: sentiment,
          tags: keywords,
          themes: detectThemes(bullet),
          quotes: [],
          priority: sentiment === "negative" ? "high" : sentiment === "mixed" ? "medium" : "low",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        items.push({ type: "insight", data: insight });
      }

      if (types.includes("feature_request")) {
        const feature: Feature = {
          id: generateId(),
          title: bullet.slice(0, 80),
          description: bullet,
          framework: "rice",
          scores: { reach: 5, impact: Math.min(10, keywords.length), confidence: 5, effort: 5 },
          totalScore: Math.min(10, keywords.length),
          priority: keywords.length >= 5 ? "high" : keywords.length >= 3 ? "medium" : "low",
          status: "backlog",
          relatedOpportunityIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        items.push({ type: "feature", data: feature });
      }
    }
  }

  return items;
}

function extractFromStructuredJSON(json: Record<string, unknown>): ExtractedItem[] {
  const items: ExtractedItem[] = [];
  const remap = new Map<string, string>();

  const entityMappings: { key: string; type: ExtractedItem["type"] }[] = [
    { key: "interviews", type: "interview" },
    { key: "experiments", type: "experiment" },
    { key: "insights", type: "insight" },
    { key: "opportunities", type: "opportunity" },
    { key: "personas", type: "persona" },
    { key: "features", type: "feature" },
    { key: "assumptions", type: "assumption" },
  ];

  for (const { key, type } of entityMappings) {
    const arr = json[key];
    if (Array.isArray(arr)) {
      for (const item of arr) {
        if (item && typeof item === "object") {
          const data = { ...item } as Record<string, unknown>;
          const invalid = validateRecordInput(key, data, false);
          if (invalid) throw new Error(`Invalid ${key} record: ${invalid}`);
          delete data._id;
          delete data.productId;
          const oldId = data.id;
          data.id = generateId();
          if (typeof oldId === "string") remap.set(oldId, data.id as string);
          if (type === "interview") Object.assign(data, { title: data.title || "Imported interview", interviewee: data.interviewee || "", date: data.date || new Date().toISOString().slice(0, 10), tags: data.tags || [], analysis: analyzeTranscript(String(data.transcript)) });
          if (type === "experiment") Object.assign(data, { hypothesis: data.hypothesis || "", metrics: { successMetric: "", failureMetric: "", ...(data.metrics as object || {}) }, duration: data.duration || "", cost: data.cost || "", risk: data.risk || "medium", expectedLearning: data.expectedLearning || "", status: data.status || "planned", relatedAssumptionIds: data.relatedAssumptionIds || [] });
          if (type === "insight") Object.assign(data, { title: data.title || String(data.description).slice(0, 80), description: data.description || data.title, source: data.source || "other", category: data.category || "unknown", emotion: data.emotion || "neutral", tags: data.tags || [], themes: data.themes || [], quotes: data.quotes || [], priority: data.priority || "medium" });
          if (type === "persona") for (const field of ["goals", "frustrations", "behaviors", "needs", "quotes", "jobsToBeDone"]) data[field] ||= [];
          if (type === "persona") Object.assign(data, { role: data.role || "", demographics: data.demographics || "" });
          if (type === "opportunity") { const scores = { impact: 5, frequency: 5, urgency: 5, businessValue: 5, strategicAlignment: 5, confidence: 5, ...(data.scores as object || {}) }; Object.assign(data, { scores, ...scoreOpportunity(scores), description: data.description || "", relatedInsightIds: data.relatedInsightIds || [], status: data.status || "new" }); }
          if (type === "feature") Object.assign(data, { description: data.description || "", framework: data.framework || "rice", scores: data.scores || {}, totalScore: typeof data.totalScore === "number" ? data.totalScore : 0, priority: data.priority || "medium", status: data.status || "backlog", relatedOpportunityIds: data.relatedOpportunityIds || [] });
          if (type === "assumption") Object.assign(data, { area: data.area || "unknown", risk: data.risk || "medium", evidence: data.evidence || "", validationStatus: data.validationStatus || "untested", relatedExperimentIds: data.relatedExperimentIds || [] });
          data.createdAt = (data.createdAt as string) || new Date().toISOString();
          data.updatedAt = new Date().toISOString();
          items.push({ type, data: data as never });
        }
      }
    }
  }

  for (const item of items) {
    const data = item.data as unknown as Record<string, unknown>;
    for (const key of ["relatedInsightIds", "relatedOpportunityIds", "relatedExperimentIds", "relatedAssumptionIds"]) if (Array.isArray(data[key])) data[key] = (data[key] as string[]).map(id => remap.get(id)).filter(Boolean);
    delete data.interviewId;
  }
  return items;
}

async function parseDocument(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();

  if (ext === "pdf") {
    try {
      const pdfModule = await import("pdf-parse");
      const pdf = new pdfModule.PDFParse({ data: new Uint8Array(buffer) });
      try { const result = await pdf.getText(); return result.text; } finally { await pdf.destroy(); }
    } catch (e) {
      throw new Error(`Failed to parse PDF: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (ext === "docx") {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (e) {
      throw new Error(`Failed to parse DOCX: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (ext === "json") {
    return buffer.toString("utf-8");
  }

  return buffer.toString("utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const productId = await getOwnedProductId(req);
    if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a document file." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Choose a file smaller than 10 MB." }, { status: 400 });
    if (!/\.(pdf|docx|txt|md|json)$/i.test(file.name)) return NextResponse.json({ error: "Use a PDF, DOCX, TXT, Markdown, or JSON file." }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;

    const text = await parseDocument(buffer, filename);

    let items: ExtractedItem[];

    if (filename.toLowerCase().endsWith(".json")) {
      try {
        const parsed = JSON.parse(text);
        items = extractFromStructuredJSON(parsed);
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Use a valid JSON evidence file." }, { status: 400 });
      }
    } else {
      items = extractFromText(/interview|transcript/i.test(filename) ? `# Interview transcript\n${text}` : text);
    }

    const seen = new Set<string>();
    items = items.filter(item => {
      const data = item.data;
      const key = item.type + ":" + ("description" in data ? data.description : "statement" in data ? data.statement : "name" in data ? data.name : data.title).trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 200);
    if (!items.length) return NextResponse.json({ error: "No usable evidence found. Try a document with customer feedback, findings, or clearly named evidence lists." }, { status: 400 });

    let savedCount = 0;
    const fileMapping: Record<string, string> = {
      interview: "interviews.json",
      experiment: "experiments.json",
      insight: "insights.json",
      opportunity: "opportunities.json",
      persona: "personas.json",
      feature: "features.json",
      assumption: "assumptions.json",
    };

    for (const item of items) {
      const fileKey = fileMapping[item.type];
      if (fileKey) {
        await createRecord(fileKey, { ...item.data, productId } as never);
        savedCount++;
      }
    }

    const summary = {
      totalInterviews: items.filter(i => i.type === "interview").length,
      totalExperiments: items.filter(i => i.type === "experiment").length,
      totalInsights: items.filter((i) => i.type === "insight").length,
      totalOpportunities: items.filter((i) => i.type === "opportunity").length,
      totalPersonas: items.filter((i) => i.type === "persona").length,
      totalFeatures: items.filter((i) => i.type === "feature").length,
      totalAssumptions: items.filter((i) => i.type === "assumption").length,
    };

    return NextResponse.json({
      success: true,
      savedCount,
      totalExtracted: items.length,
      summary,
      items,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to process document", details: String(error) },
      { status: 500 }
    );
  }
}
