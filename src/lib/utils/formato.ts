// Formata nomes de funcao/ministerio para exibição legível
export function formatarFuncao(funcao: string): string {

  let dexPara: Record<string, string> = {
    "insight_jovens_e_adolescentes": "Insight (Jovens e Adolescentes)",
    "recepcao": "Recepção",
    "ebd_soldadinhos_0_a_6": "EBD Soldadinhos (0 a 6)",
    "culto_soldadinhos_0_a_6": "Culto Soldadinhos (0 a 6)",
    "culto_infantil_5_a_11": "Culto Infantil (5 a 11)",
    "clube_biblico_juniores": "Clube Bíblico Juniores"
  };
  

  return dexPara[funcao] || funcao
    .replaceAll("_", " ")
    .split(" ")
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
    .join(" ");
}

// Formata nome de pessoa para exibição (sem modificar original)
export function formatarNome(nome: string): string {
  return nome.trim();
}

// Formata lista de nomes para exibição legível
export function formatarListaNomes(nomes: string[]): string {
  if (nomes.length === 0) return "(sem responsável)";
  if (nomes.length === 1) return nomes[0];
  if (nomes.length === 2) return `${nomes[0]} e ${nomes[1]}`;
  return nomes.slice(0, -1).join(", ") + ` e ${nomes[nomes.length - 1]}`;
}
