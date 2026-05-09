export interface Strand {
  id: string;
  emoji: string;
  description: string;
  gradient: string;
  badgeBg: string;
  badgeText: string;
  topics: string[];
}

export const STRANDS: Strand[] = [
  {
    id: "Number",
    emoji: "🔢",
    description: "Surds, indices, financial maths, ratios",
    gradient: "from-blue-500 to-blue-700",
    badgeBg: "bg-blue-100 dark:bg-blue-900/40",
    badgeText: "text-blue-700 dark:text-blue-300",
    topics: [
      "Explain surds and irrational numbers",
      "Help me with compound interest",
      "How do index laws work?",
      "Solve a ratio and rate problem",
      "Calculate simple interest",
      "What is scientific notation?",
    ],
  },
  {
    id: "Algebra",
    emoji: "📐",
    description: "Equations, quadratics, linear functions",
    gradient: "from-violet-500 to-purple-700",
    badgeBg: "bg-violet-100 dark:bg-violet-900/40",
    badgeText: "text-violet-700 dark:text-violet-300",
    topics: [
      "How do I expand binomial products?",
      "Help me factorise a quadratic",
      "Solve a pair of simultaneous equations",
      "Explain gradient and y-intercept",
      "How do I solve a linear inequality?",
      "What are algebraic fractions?",
    ],
  },
  {
    id: "Measurement",
    emoji: "📏",
    description: "Pythagoras, trigonometry, area & volume",
    gradient: "from-emerald-500 to-green-700",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/40",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    topics: [
      "Help me use Pythagoras' theorem",
      "How do sin, cos and tan work?",
      "Find the volume of a cylinder",
      "Calculate the surface area of a cone",
      "What is the area of a composite shape?",
      "How do I find an arc length?",
    ],
  },
  {
    id: "Space",
    emoji: "🔷",
    description: "Geometry, transformations, coordinate plane",
    gradient: "from-cyan-500 to-teal-700",
    badgeBg: "bg-cyan-100 dark:bg-cyan-900/40",
    badgeText: "text-cyan-700 dark:text-cyan-300",
    topics: [
      "Explain parallel lines and transversals",
      "How do I find the midpoint of two points?",
      "What is a dilation transformation?",
      "Help me with congruent triangles",
      "How do I find distance on a number plane?",
      "Explain similar figures and scale factors",
    ],
  },
  {
    id: "Statistics",
    emoji: "📊",
    description: "Data, graphs, mean, median, scatter plots",
    gradient: "from-orange-500 to-amber-600",
    badgeBg: "bg-orange-100 dark:bg-orange-900/40",
    badgeText: "text-orange-700 dark:text-orange-300",
    topics: [
      "How do I read a box plot?",
      "Explain mean, median and mode",
      "What does a scatter plot show?",
      "How do I make a stem-and-leaf plot?",
      "What is correlation vs causation?",
      "Describe a skewed data distribution",
    ],
  },
  {
    id: "Probability",
    emoji: "🎲",
    description: "Chance, tree diagrams, Venn diagrams",
    gradient: "from-rose-500 to-red-700",
    badgeBg: "bg-rose-100 dark:bg-rose-900/40",
    badgeText: "text-rose-700 dark:text-rose-300",
    topics: [
      "How do I use a tree diagram?",
      "What is theoretical vs experimental probability?",
      "Help me with a two-way table",
      "Explain independent and dependent events",
      "How do I use a Venn diagram for probability?",
      "List outcomes for an experiment without replacement",
    ],
  },
];

// Ported from tutor_app.py STRAND_KEYWORD_MAP
const KEYWORD_MAP: Record<string, string[]> = {
  Number: [
    "fraction", "decimal", "percentage", "ratio", "rate", "integer",
    "irrational", "rational", "real number", "surds", "surd", "index", "indices",
    "scientific notation", "significant figures", "rounding", "proportion",
    "financial", "interest", "profit", "loss", "tax", "depreciation",
    "compound interest", "simple interest", "income",
  ],
  Algebra: [
    "equation", "expression", "expand", "factorise", "factorize",
    "simplify", "linear", "quadratic", "parabola", "gradient", "slope",
    "intercept", "simultaneous", "inequality", "substitution",
    "polynomial", "binomial", "pronumeral", "variable", "formula",
    "function", "relation", "direct proportion", "index law", "algebraic fraction",
  ],
  Measurement: [
    "area", "perimeter", "volume", "surface area", "length", "mass",
    "capacity", "pythagoras", "trigonometry", "sine", "cosine",
    "tangent", "angle", "bearing", "similar", "congruent", "scale",
    "unit conversion", "composite shape", "prism", "cylinder",
    "cone", "sphere", "pyramid", "arc", "sector",
  ],
  Space: [
    "geometry", "parallel", "perpendicular", "transformation",
    "reflection", "rotation", "translation", "dilation", "symmetry",
    "polygon", "circle", "chord", "coordinate", "cartesian",
    "proof", "theorem", "congruence", "similarity", "midpoint", "distance",
    "transversal", "number plane",
  ],
  Statistics: [
    "data", "mean", "median", "mode", "range", "outlier", "histogram",
    "stem", "leaf", "box plot", "dot plot", "scatter", "correlation",
    "distribution", "skew", "symmetric", "bimodal", "frequency",
    "relative frequency", "sample", "population", "survey",
    "back-to-back", "interquartile", "quartile",
  ],
  Probability: [
    "probability", "chance", "likelihood", "event", "outcome",
    "sample space", "tree diagram", "venn diagram", "two-way table",
    "independent", "dependent", "replacement", "complementary",
    "experimental", "theoretical", "random", "equally likely",
  ],
};

export function detectStrand(text: string): string | null {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [strand, keywords] of Object.entries(KEYWORD_MAP)) {
    scores[strand] = keywords.filter(kw => lower.includes(kw)).length;
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : null;
}

export function getStrand(id: string): Strand | undefined {
  return STRANDS.find(s => s.id === id);
}
