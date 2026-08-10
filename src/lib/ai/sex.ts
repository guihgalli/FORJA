/** Valores de sexo alinhados ao CHECK do banco (`students.sex`). */
export const ATHLETE_SEX_VALUES = [
  "masculino",
  "feminino",
  "outro",
  "prefiro_nao_dizer",
] as const;

export type AthleteSex = (typeof ATHLETE_SEX_VALUES)[number];

const SEX_ALIASES: Record<string, AthleteSex> = {
  masculino: "masculino",
  male: "masculino",
  m: "masculino",
  homem: "masculino",
  feminino: "feminino",
  female: "feminino",
  f: "feminino",
  mulher: "feminino",
  outro: "outro",
  other: "outro",
  prefiro_nao_dizer: "prefiro_nao_dizer",
  "prefiro não dizer": "prefiro_nao_dizer",
  "nao informar": "prefiro_nao_dizer",
  "não informar": "prefiro_nao_dizer",
};

export function normalizeAthleteSex(value: unknown): AthleteSex | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  return SEX_ALIASES[key] ?? null;
}

export function extractSexFromProfile(
  profile: Record<string, unknown> | null | undefined,
): AthleteSex | null {
  if (!profile) return null;
  return normalizeAthleteSex(profile.sex ?? profile.sexo);
}

/**
 * Diretrizes de programação por sexo biológico declarado.
 * Evita estereótipos rígidos: o objetivo, histórico e limitações sempre prevalecem.
 */
export const SEX_TRAINING_GUIDELINES = `
DIRETRIZES POR SEXO (campo ATHLETE PROFILE.sex):
- Sempre leia o sexo do perfil e adapte volume, distribuição muscular, densidades e recuperação.
- Nunca ignore objetivo, experiência, esporte, limitações e preferências do formulário em favor de estereótipos.
- Sexo "outro" ou "prefiro_nao_dizer": programe de forma individualizada sem assumir padrões de masculino/feminino.

Quando sex = "feminino":
1. Em hipertrofia/definição, priorize cadeia posterior e glúteos (hip thrust, stiff, abdução, afundos) com volume semanal adequado.
2. Mulheres em geral toleram bem volume relativo e faixas de repetições um pouco mais altas (8–15) nos acessórios; mantenha compostos com RIR 1–3.
3. Inclua estabilização de quadril/core e cuidado com sobrecarga axial excessiva se houver histórico de dor lombar.
4. Em performance esportiva, equilibre potência de membros inferiores com prevenção (posteriores, glúteo médio).
5. Evite treinos só de “upper peito/ombros”; busque equilíbrio inferior/superior conforme o objetivo.
6. Se a atleta mencionar ciclo menstrual nas preferências, ajuste intensidade/volume com prudência (não é diagnóstico médico).

Quando sex = "masculino":
1. Em hipertrofia, distribuição clássica peito/costas/ombros/pernas é válida, sem negligenciar posteriores e core.
2. Maior ênfase relativa em força absoluta nos compostos (cargas mais altas, RIR controlado) quando experiência permitir.
3. Monitore volume de push (peito/ombros/tríceps) para evitar desequilíbrio com puxada e posteriores.
4. Em futebol/performance, priorize potência, sprint mechanics e prevenção de isquiotibiais.

RATIONALE: mencione brevemente como o sexo do atleta influenciou a seleção (ex.: “ênfase em glúteos/posteriores por perfil feminino”).
`.trim();

export type MuscleBias = {
  prefer: string[];
  deprioritize: string[];
  nameHint: string;
  rationaleHint: string;
};

export function muscleBiasForSex(sex: AthleteSex | null): MuscleBias | null {
  if (sex === "feminino") {
    return {
      prefer: ["gluteos", "posteriores", "quadriceps", "core", "costas"],
      deprioritize: ["peito", "triceps", "ombros"],
      nameHint: "Glúteos e Posteriores",
      rationaleHint:
        "Seleção adaptada ao perfil feminino: ênfase em glúteos e cadeia posterior, volume acessório em faixas de reps moderadas-altas e equilíbrio com prevenção.",
    };
  }
  if (sex === "masculino") {
    return {
      prefer: ["peito", "costas", "ombros", "quadriceps", "triceps"],
      deprioritize: [],
      nameHint: "Upper e Compostos",
      rationaleHint:
        "Seleção adaptada ao perfil masculino: compostos de força/hipertrofia com equilíbrio push/pull e atenção a posteriores para prevenção.",
    };
  }
  return null;
}
