export const ECOSYSTEMS = [
  "npm",
  "PyPI",
  "NuGet",
  "Maven",
  "Gradle",
  "Composer",
  "RubyGems",
  "Go",
  "Cargo",
  "Hex",
  "Pub",
  "Swift",
] as const;

interface Grade {
  letter: string;
  threshold: string;
  color: string;
  label: string;
  desc: string;
}

export const GRADES: Grade[] = [
  {
    letter: "A",
    threshold: "≥ 90",
    color: "var(--green)",
    label: "Sécurisé",
    desc: "Dépendances saines",
  },
  {
    letter: "B",
    threshold: "≥ 75",
    color: "var(--cyan)",
    label: "Minimal",
    desc: "Risque faible, veille suffisante",
  },
  {
    letter: "C",
    threshold: "≥ 60",
    color: "var(--yellow)",
    label: "Faible",
    desc: "Mises à jour mineures disponibles",
  },
  {
    letter: "D",
    threshold: "≥ 45",
    color: "var(--orange)",
    label: "Modéré",
    desc: "Correctifs à appliquer rapidement",
  },
  {
    letter: "E",
    threshold: "≥ 30",
    color: "color-mix(in srgb, var(--orange) 55%, var(--red))",
    label: "Élevé",
    desc: "Vulnérabilités actives, traitement prioritaire",
  },
  {
    letter: "F",
    threshold: "< 30",
    color: "var(--red)",
    label: "Critique",
    desc: "Exposition critique",
  },
];

export const LEDGER_ROWS: { label: string; amount: number }[] = [
  { label: "Vulnérabilité critique", amount: -15 },
  { label: "Runtime en fin de vie", amount: -15 },
  { label: "Vulnérabilité élevée", amount: -10 },
  { label: "Dépendance en fin de vie", amount: -10 },
  { label: "Vulnérabilité moyenne", amount: -5 },
  { label: "Vulnérabilité faible", amount: -2 },
  { label: "Retard de version majeure", amount: -2 },
  { label: "Retard de version mineure", amount: -1 },
];

export const PROCESS_STEPS = [
  {
    id: "connect",
    title: "Connectez vos dépôts",
    desc: "GitHub ou GitLab, dépôts privés inclus. Accès chiffré, en lecture seule, limité à l'analyse de vos dépendances.",
    color: "var(--accent)",
  },
  {
    id: "scan",
    title: "Laissez tourner les scans",
    desc: "Quotidiens, hebdomadaires, mensuels ou à la demande. Déclenchables aussi via vos pipelines CI/CD grâce aux clés API.",
    color: "var(--purple)",
  },
  {
    id: "act",
    title: "Agissez sur alerte",
    desc: "Dès qu'une faille dépasse le seuil CVSS fixé, un email part aux administrateurs avec le risque et la version corrigée.",
    color: "var(--green)",
  },
] as const;

interface CompareFeature {
  feature: string;
  badge?: string;
  competitor: string;
  sentinel: string;
}

export const COMPARE_FEATURES: CompareFeature[] = [
  {
    feature: "CVE & dépendances obsolètes",
    competitor: "Snyk et Dependabot, deux outils séparés",
    sentinel: "Croisés en un seul scan, dans un seul outil",
  },
  {
    feature: "Fin de vie des runtimes",
    competitor: "Non couvert par Snyk, Dependabot ni Renovate",
    sentinel: "Runtimes obsolètes repérés à chaque scan",
  },
  {
    feature: "Score de santé",
    competitor: "Aucune vue d'ensemble consolidée",
    sentinel: "Un score clair par projet",
  },
  {
    feature: "Remédiation & conformité",
    competitor: "Tracker externe type Jira, sans SBOM ni rapport",
    sentinel: "Ticket, SBOM et rapport générés dans l'outil",
  },
];

export const FAQ_ITEMS = [
  {
    question: "Sentinel accède-t-il à mon code source ?",
    answer:
      "Non. Sentinel lit uniquement vos manifestes et lockfiles (package.json, .csproj, requirements.txt, etc.). Le jeton d'accès est chiffré, la connexion se fait en lecture seule, et votre logique métier n'est jamais analysée ni stockée sur nos serveurs.",
  },
  {
    question: "D'où viennent les données de vulnérabilités ?",
    answer:
      "Exclusivement des bases publiques et reconnues : OSV.dev pour les CVE et les advisories GitHub, avec leurs scores CVSS, endoflife.date pour les échéances de fin de vie des runtimes, et les registres officiels (npm, NuGet, PyPI, Maven Central…) pour les dernières versions disponibles.",
  },
  {
    question: "Quels langages et écosystèmes sont couverts ?",
    answer:
      "12 écosystèmes : npm, PyPI, NuGet, Maven, Gradle, Composer, RubyGems, Go, Cargo, Hex, Pub et Swift. Soit 26 formats de manifestes et lockfiles reconnus, du package-lock.json au Cargo.lock.",
  },
  {
    question: "Comment Sentinel protège-t-il mes tokens et mes données ?",
    answer:
      "Les tokens d'accès sont chiffrés au repos et utilisés uniquement en lecture seule. Aucun code source n'est dupliqué sur nos serveurs : seuls les manifestes de dépendances sont analysés. L'ensemble des communications transite en HTTPS et un audit log conserve la trace de chaque accès sensible.",
  },
  {
    question: "Puis-je déclencher un scan depuis GitHub Actions ou GitLab CI ?",
    answer:
      "Oui. Une clé API par organisation permet de déclencher un scan à la demande depuis n'importe quelle pipeline CI/CD, GitHub Actions ou GitLab CI compris, en plus des scans planifiés (quotidiens, hebdomadaires ou mensuels).",
  },
] as const;
