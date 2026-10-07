export interface DeterministicMatchResult {
  keywordMatchScore: number; // 0 - 100
  matchedKeywords: string[];
  missingKeywords: string[];
  jaccardSimilarity: number; // 0 - 1 float
  coverageRatio: number; // 0 - 1 float
  totalJdKeywords: number;
  totalResumeKeywords: number;
}

// Comprehensive English stopwords and generic resume/job posting noise
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both',
  'but', 'by', 'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does',
  'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll',
  'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s',
  'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s',
  'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor',
  'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves',
  'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should',
  'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll',
  'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t',
  'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s',
  'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll',
  'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  // Generic resume boilerplate / fillers
  'will', 'work', 'working', 'worked', 'years', 'experience', 'responsible', 'duties', 'including',
  'ability', 'required', 'preferred', 'skills', 'role', 'team', 'company', 'candidate', 'looking',
  'must', 'plus', 'strong', 'knowledge', 'understanding', 'good', 'great', 'ideal', 'equal',
  'opportunity', 'employer', 'benefits', 'salary', 'position', 'job', 'description', 'requirements',
  'responsibilities', 'etc', 'demonstrated', 'proven', 'proficient', 'seeking', 'well', 'high',
  'level', 'related', 'field', 'help', 'join', 'build', 'building', 'across', 'within',
  'environment', 'support', 'using', 'used', 'use', 'ensure', 'ensuring', 'new', 'daily'
]);

/**
 * Normalizes a word token while preserving programming languages and technical terms
 * such as c++, c#, .net, node.js, next.js, ci/cd.
 */
function cleanToken(word: string): string {
  let token = word.toLowerCase().trim();
  if (token === 'c++' || token === 'c#' || token === '.net') {
    return token;
  }
  // Strip punctuation at start and end
  token = token.replace(/^[^a-z0-9+#.]+|[^a-z0-9+#.]+$/gi, '');
  // If ends with a period and isn't .net or a dot-term like node.js, strip trailing dot
  if (token.endsWith('.') && !token.includes('.js') && token !== '.net') {
    token = token.replace(/\.+$/, '');
  }
  return token;
}

/**
 * Extracts unigrams and bigrams from text, respecting clause and list boundaries
 * (commas, newlines, semicolons) so terms aren't falsely joined across items.
 */
function extractNgramsFromText(text: string): {
  terms: Map<string, number>; // normalized term -> frequency
  displayMap: Map<string, string>; // normalized term -> best display casing
  allTokens: string[];
} {
  const terms = new Map<string, number>();
  const displayMap = new Map<string, string>();
  const allTokens: string[] = [];

  // Split on clause/item boundaries: commas, semicolons, newlines, tabs, pipes, bullets, and sentence-ending periods
  const phraseSegments = text.split(/(?:,\s*|;\s*|\.\s+|\n+|\t+|\|+|\u2022+)/);

  for (const phrase of phraseSegments) {
    if (!phrase.trim()) continue;
    // Split phrase into words
    const rawWords = phrase.split(/\s+/);
    const phraseTokens: string[] = [];

    for (const raw of rawWords) {
      const cleaned = cleanToken(raw);
      if (
        cleaned.length >= 2 &&
        !/^\d+$/.test(cleaned) &&
        !cleaned.includes('[redacted')
      ) {
        phraseTokens.push(cleaned);
        allTokens.push(cleaned);
      }
    }

    // 1. Unigrams
    for (let i = 0; i < phraseTokens.length; i++) {
      const t = phraseTokens[i];
      if (!STOP_WORDS.has(t)) {
        terms.set(t, (terms.get(t) || 0) + 1);
        if (!displayMap.has(t)) {
          displayMap.set(t, capitalizeTerm(t));
        }
      }

      // 2. Bigrams (within the same phrase segment only)
      if (i < phraseTokens.length - 1) {
        const nextT = phraseTokens[i + 1];
        if (!STOP_WORDS.has(t) && !STOP_WORDS.has(nextT)) {
          const bigram = `${t} ${nextT}`;
          terms.set(bigram, (terms.get(bigram) || 0) + 1);
          if (!displayMap.has(bigram)) {
            displayMap.set(bigram, `${capitalizeTerm(t)} ${capitalizeTerm(nextT)}`);
          }
        }
      }
    }
  }

  return { terms, displayMap, allTokens };
}

function capitalizeTerm(term: string): string {
  if (term === 'c++' || term === 'c#' || term === '.net' || term === 'ci/cd' || term === 'aws' || term === 'api' || term === 'sql' || term === 'ui' || term === 'ux') {
    return term.toUpperCase();
  }
  return term.charAt(0).toUpperCase() + term.slice(1);
}

/**
 * Deterministically computes mathematical overlap, Jaccard similarity, and keyword match score
 * between resume text and a job description.
 */
export function calculateDeterministicMatch(
  resumeText: string,
  jobDescription: string
): DeterministicMatchResult {
  const resumeData = extractNgramsFromText(resumeText);
  const jdData = extractNgramsFromText(jobDescription);

  if (jdData.terms.size === 0) {
    return {
      keywordMatchScore: 75,
      matchedKeywords: [],
      missingKeywords: [],
      jaccardSimilarity: 0,
      coverageRatio: 0,
      totalJdKeywords: 0,
      totalResumeKeywords: resumeData.terms.size,
    };
  }

  // Resume searchable bag: all normalized unigrams and joined space-separated stream
  const resumeTokenStream = ` ${resumeData.allTokens.join(' ')} `;
  const resumeUnigramSet = new Set(resumeData.terms.keys());

  const matchedList: { term: string; display: string; freq: number }[] = [];
  const missingList: { term: string; display: string; freq: number }[] = [];

  let totalJdWeight = 0;
  let matchedWeight = 0;

  for (const [term, freq] of jdData.terms.entries()) {
    const display = jdData.displayMap.get(term) || term;
    totalJdWeight += freq;

    // A term is matched if:
    // - For unigrams: exists in resume set
    // - For bigrams: exists as continuous sequence in resume token stream
    const isMatched = term.includes(' ')
      ? resumeTokenStream.includes(` ${term} `)
      : resumeUnigramSet.has(term);

    if (isMatched) {
      matchedWeight += freq;
      matchedList.push({ term, display, freq });
    } else {
      missingList.push({ term, display, freq });
    }
  }

  // Sort by frequency in Job Description (most critical first)
  matchedList.sort((a, b) => b.freq - a.freq);
  missingList.sort((a, b) => b.freq - a.freq);

  // Calculate mathematical ratios
  const coverageRatio = totalJdWeight > 0 ? matchedWeight / totalJdWeight : 0;
  
  // Jaccard similarity over distinct keyword vocabularies
  const jdKeySet = new Set(jdData.terms.keys());
  const unionSet = new Set([...jdKeySet, ...resumeUnigramSet]);
  const intersectionSize = matchedList.length;
  const jaccardSimilarity = unionSet.size > 0 ? intersectionSize / unionSet.size : 0;

  // Compute final 0-100 score based on coverage ratio
  const keywordMatchScore = Math.min(100, Math.max(0, Math.round(coverageRatio * 100)));

  return {
    keywordMatchScore,
    matchedKeywords: matchedList.map(item => item.display),
    missingKeywords: missingList.map(item => item.display),
    jaccardSimilarity: Math.round(jaccardSimilarity * 1000) / 1000,
    coverageRatio: Math.round(coverageRatio * 1000) / 1000,
    totalJdKeywords: jdData.terms.size,
    totalResumeKeywords: resumeData.terms.size,
  };
}
