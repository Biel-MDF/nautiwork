// O que o mercado está pedindo em cada área, a partir de pesquisas e relatórios publicados
// em 2026 (fontes em cada área). É conteúdo editorial: revise a cada semestre.
// `jobAreas` liga a área às áreas usadas nas vagas do Nautiwork; `keywords` serve para
// reconhecer habilidades do perfil que pertencem à área (sem acento, minúsculas).
// `indicators` são notas de 1 a 5 dadas pela equipe a partir das fontes da área, para o
// gráfico comparativo: não são medições oficiais e a página diz isso.

export type Demand = "Muito alta" | "Alta" | "Estável" | "Em mudança";

export type Indicators = {
  /** procura por profissionais hoje */
  demanda: number;
  /** quanto a tecnologia e a IA já mudam a rotina da área */
  tecnologia: number;
  /** facilidade de entrar sem experiência (estágio, nível técnico, vaga júnior) */
  entrada: number;
  /** quanto do trabalho pode ser feito a distância */
  remoto: number;
  /** peso de registro em conselho, residência ou certificação obrigatória */
  registro: number;
};

export const INDICATOR_LABELS: Record<keyof Indicators, { label: string; hint: string }> = {
  demanda: { label: "Demanda", hint: "Procura por profissionais hoje" },
  tecnologia: { label: "Tecnologia e IA", hint: "Quanto a tecnologia já muda a rotina" },
  entrada: { label: "Porta de entrada", hint: "Facilidade de começar sem experiência" },
  remoto: { label: "Trabalho remoto", hint: "Quanto do trabalho pode ser a distância" },
  registro: { label: "Exigência formal", hint: "Peso de registro, residência ou certificação" },
};

export type MarketArea = {
  id: string;
  name: string;
  short: string;
  demand: Demand;
  summary: string;
  roles: string[];
  hardSkills: string[];
  softSkills: string[];
  tools: string[];
  trend: string;
  start: string;
  indicators: Indicators;
  jobAreas: string[];
  keywords: string[];
  sources: { title: string; url: string }[];
};

export const MARKET_UPDATED = "novembro de 2026";

/** Tendências que valem para todas as áreas. */
export const MARKET_TRENDS: { title: string; text: string; source: { title: string; url: string } }[] = [
  { title: "Contratação por habilidades", text: "Empresas avaliam o que a pessoa sabe fazer, mais do que cargo anterior ou diploma. Perfis com habilidades bem descritas aparecem melhor nas buscas.",
    source: { title: "Recruitee, tendências de RH 2026", url: "https://recruitee.com/blog/hr-trends-and-predictions" } },
  { title: "Letramento em IA em todas as profissões", text: "Saber usar ferramentas de IA generativa com critério aparece nas listas de habilidades em alta de vendas, educação, RH, finanças e marketing.",
    source: { title: "Money Times, Habilidades em Alta 2026 (LinkedIn)", url: "https://www.moneytimes.com.br/estas-habilidades-vao-impulsionar-o-mercado-de-trabalho-em-2026-igdl/" } },
  { title: "Técnica junto com comportamento", text: "Comunicação, negociação e análise crítica continuam decidindo contratações, agora somadas ao domínio de tecnologia.",
    source: { title: "Olhar Digital, Guia Salarial Robert Half 2026", url: "https://olhardigital.com.br/2025/11/05/pro/profissoes-em-alta-para-2026-salarios-setores-e-habilidades-mais-valorizadas/" } },
  { title: "Falta de profissionais qualificados", text: "A maioria das empresas no Brasil relata dificuldade para contratar pessoas com as competências necessárias, acima da média mundial.",
    source: { title: "Mundo Logística, ManpowerGroup 2026", url: "https://mundologistica.com.br/noticias/qual-o-perfil-do-profissional-de-logistica-que-as-empresas-procuram-hoje" } },
];

const LINKEDIN_AREAS = { title: "Money Times: habilidades em alta por área (LinkedIn)", url: "https://www.moneytimes.com.br/estas-habilidades-vao-impulsionar-o-mercado-de-trabalho-em-2026-igdl/" };
const ROBERT_HALF = { title: "CNN Brasil: Guia Salarial Robert Half 2026", url: "https://www.cnnbrasil.com.br/economia/financas/disputa-por-talentos-se-intensifica-com-avanco-da-ia-diz-pesquisa/" };
const LINKEDIN_CARGOS = { title: "Convergência Digital: empregos em alta 2026 (LinkedIn)", url: "https://convergenciadigital.com.br/mercado/engenheiro-de-inteligencia-artificial-a-profissao-mais-buscada-pelo-mercado-em-2026/" };

export const MARKET_AREAS: MarketArea[] = [
  {
    id: "ti", name: "Tecnologia da Informação", short: "TI", demand: "Muito alta",
    summary: "Segue entre as áreas que mais contratam, com o mercado pedindo tecnologia aplicada: automação, segurança e IA que resolvem problemas do negócio.",
    roles: ["Desenvolvedor(a) full stack", "Arquiteto(a) de software", "Analista de segurança da informação", "Engenheiro(a) de cloud", "Analista de testes (QA)"],
    hardSkills: ["Desenvolvimento de software com IA", "Computação em nuvem", "Segurança da informação", "Integração de sistemas (APIs)", "Testes automatizados", "Linguagens de programação"],
    softSkills: ["Visão de negócio", "Comunicação com áreas não técnicas", "Aprendizado contínuo"],
    tools: ["Git", "Docker", "AWS, Azure ou GCP", "TypeScript", "Python", "Linux"],
    trend: "A Robert Half aponta segurança, desenvolvimento de software e cloud entre as competências que garantem salários acima da média. Vagas de entrada pedem projeto prático publicado.",
    start: "Monte 2 ou 3 projetos completos e publicados, com testes e documentação, e inclua uma integração com IA.",
    indicators: { demanda: 5, tecnologia: 5, entrada: 3, remoto: 5, registro: 1 },
    jobAreas: ["Tecnologia", "TI", "Desenvolvimento"],
    keywords: ["typescript", "javascript", "react", "node", "python", "sql", "git", "java", "c#", "docker", "aws", "cloud", "api", "html", "css", "postgres", "react native", "unity", "linux", "seguranca", "testes"],
    sources: [
      { title: "Convergência Digital: Guia Salarial Robert Half 2026 em TI", url: "https://convergenciadigital.com.br/?p=47354" },
      { title: "Canaltech: 10 habilidades em alta em TI (LinkedIn, 2026)", url: "https://canaltech.com.br/mercado/10-habilidades-que-estao-em-alta-na-area-de-ti-em-2026-segundo-o-linkedin/" },
      ROBERT_HALF,
    ],
  },
  {
    id: "dados", name: "Dados e Inteligência Artificial", short: "Dados e IA", demand: "Muito alta",
    summary: "Engenheiro(a) de IA lidera o ranking de cargos que mais crescem no país. O mercado prioriza quem liga dados e IA a decisões reais, não só quem domina ferramentas.",
    roles: ["Engenheiro(a) de IA", "Cientista de dados", "Engenheiro(a) de dados", "Engenheiro(a) de machine learning", "Analista de BI"],
    hardSkills: ["Python e SQL", "Machine learning", "IA generativa e LLMs", "Pipelines de dados (dbt)", "Estatística", "Visualização de dados"],
    softSkills: ["Pensamento crítico", "Contar histórias com dados", "Curiosidade"],
    tools: ["Python", "SQL", "Power BI", "Notebooks (Jupyter)", "Nuvem de dados"],
    trend: "Pelo Guia Robert Half 2026, engenheiro(a) de IA é o cargo de tecnologia mais bem pago, entre R$ 19.500 e R$ 27.100. Grande parte das vagas é remota.",
    start: "Publique análises com dados abertos (do IBGE, por exemplo) explicando a pergunta, o método e a conclusão.",
    indicators: { demanda: 5, tecnologia: 5, entrada: 2, remoto: 5, registro: 1 },
    jobAreas: ["Dados", "Inteligência Artificial", "BI"],
    keywords: ["python", "sql", "dados", "ia", "machine learning", "power bi", "estatistica", "excel", "dbt", "pandas", "bi", "analise de dados"],
    sources: [
      { title: "Diario de Pernambuco: quanto ganha um engenheiro de IA em 2026", url: "https://diariodepernambuco.com.br/dpmais/quanto-ganha-um-engenheiro-de-inteligencia-artificial-em-2026/" },
      { title: "CNN Brasil: 5 carreiras de dados que ganham força em 2026", url: "https://www.cnnbrasil.com.br/educacao/quer-trabalhar-com-dados-5-carreiras-que-devem-ganhar-forca-em-2026/" },
      { title: "Bain e Data Hackers: State of Data Brasil 2025-2026", url: "https://www.bain.com/pt-br/insights/state-of-data-2025/" },
    ],
  },
  {
    id: "medicina", name: "Medicina", short: "Medicina", demand: "Alta",
    summary: "Há trabalho, mas a concorrência aumentou com a abertura de cursos. A residência e a especialização viraram o principal filtro, e a telessaúde mudou parte da rotina.",
    roles: ["Médico(a) de família e comunidade", "Médico(a) intensivista", "Médico(a) do trabalho", "Médico(a) em telessaúde", "Médico(a) especialista"],
    hardSkills: ["Medicina baseada em evidências", "Urgência e emergência", "Prontuário eletrônico", "Telessaúde", "Uso crítico de IA no apoio ao diagnóstico", "Saúde ocupacional (NR-1)"],
    softSkills: ["Comunicação com paciente e família", "Decisão sob pressão", "Ética"],
    tools: ["Registro no CRM", "Residência médica", "Cursos de suporte de vida (ACLS)"],
    trend: "Para recém-formados, a residência passou a ser o principal caminho de ascensão. A nova NR-1 também abre espaço para a medicina do trabalho.",
    start: "Durante o curso, ligas acadêmicas e estágio em urgência pesam na seleção da residência.",
    indicators: { demanda: 4, tecnologia: 3, entrada: 2, remoto: 2, registro: 5 },
    jobAreas: ["Medicina"],
    keywords: ["medicina", "clinica", "paciente", "hospital", "diagnostico", "urgencia", "plantao", "saude"],
    sources: [
      { title: "Band: mercado para médicos recém-formados", url: "https://www.band.com.br/educacao/queroestudarmedicina/noticias/ainda-existe-emprego-garantido-para-medicos-recem-formados-202603311535" },
      { title: "Educa Mais Brasil: riscos psicossociais e a NR-1", url: "https://www.educamaisbrasil.com.br/educacao/noticias/riscos-psicossociais-afetam-58-dos-trabalhadores-no-brasil" },
    ],
  },
  {
    id: "enfermagem", name: "Enfermagem e Saúde", short: "Enfermagem", demand: "Muito alta",
    summary: "O envelhecimento da população e a expansão de serviços mantêm a demanda alta, principalmente no nível técnico, com vagas em hospitais, clínicas e atendimento domiciliar.",
    roles: ["Técnico(a) de enfermagem", "Enfermeiro(a) de UTI e urgência", "Auxiliar de enfermagem", "Técnico(a) em análises clínicas", "Cuidador(a) de idosos"],
    hardSkills: ["Protocolos clínicos e segurança do paciente", "Administração de medicamentos", "Urgência e terapia intensiva", "Prontuário eletrônico", "Cuidados com idosos", "Controle de infecção"],
    softSkills: ["Empatia", "Trabalho em equipe multiprofissional", "Atenção a detalhes"],
    tools: ["Registro no Coren", "Curso técnico ou graduação", "Cursos de suporte de vida (BLS)"],
    trend: "Auxiliar e técnico(a) de enfermagem aparecem no topo da lista de empregos em alta do LinkedIn para 2026.",
    start: "O curso técnico e o registro no Coren abrem portas rápido. Estágio em urgência ou UTI pesa muito no currículo.",
    indicators: { demanda: 5, tecnologia: 2, entrada: 4, remoto: 1, registro: 5 },
    jobAreas: ["Saúde", "Enfermagem"],
    keywords: ["enfermagem", "saude", "paciente", "hospital", "primeiros socorros", "cuidador", "laboratorio", "farmacia", "biomedicina"],
    sources: [
      LINKEDIN_CARGOS,
      { title: "PEBSP: ranking LinkedIn Empregos em Alta 2026", url: "https://www.pebsp.com/o-curso-tecnico-a-frente-de-quase-todas-as-profissoes-do-brasil-em-2026/" },
      { title: "Educa Mais Brasil: enfermagem em alta em 2026", url: "https://www.educamaisbrasil.com.br/educacao/carreira/enfermagem-em-alta-5-areas-promissoras-em-2026" },
    ],
  },
  {
    id: "biologia", name: "Biologia e Biotecnologia", short: "Biologia", demand: "Alta",
    summary: "Mercado diversificado: meio ambiente, saúde, laboratórios, educação e biotecnologia. Cresce quem junta biologia com dados, como na bioinformática.",
    roles: ["Biólogo(a) ambiental", "Analista de laboratório", "Bioinformata", "Pesquisador(a) em biotecnologia", "Consultor(a) de licenciamento ambiental"],
    hardSkills: ["Licenciamento e monitoramento ambiental", "Biologia molecular", "Bioinformática", "Análises laboratoriais", "Estatística aplicada", "Programação para biologia (Python ou R)"],
    softSkills: ["Rigor científico", "Escrita técnica", "Trabalho de campo"],
    tools: ["Registro no CRBio", "Python ou R", "Sistemas de informação geográfica (SIG)"],
    trend: "Biotecnologia, bioinformática e conservação da biodiversidade estão redesenhando a profissão. Biólogos migram para a bioinformática somando programação e estatística.",
    start: "Iniciação científica e um curso de Python ou R para dados biológicos diferenciam muito o currículo.",
    indicators: { demanda: 3, tecnologia: 4, entrada: 3, remoto: 2, registro: 4 },
    jobAreas: ["Biologia", "Biotecnologia", "Laboratório"],
    keywords: ["biologia", "laboratorio", "biotecnologia", "bioinformatica", "meio ambiente", "licenciamento", "pesquisa", "microbiologia", "genetica", "r"],
    sources: [
      { title: "Quero Bolsa: mercado de trabalho em Biologia", url: "https://querobolsa.com.br/revista/mercado-trabalho-biologia" },
      { title: "Quero Bolsa: bioinformática", url: "https://querobolsa.com.br/revista/bioinformatica-conheca-a-carreira" },
      { title: "AI Resume Guru: competências para biólogos em 2026", url: "https://airesume.guru/pt/competencias-curriculo/biologo" },
    ],
  },
  {
    id: "psicologia", name: "Psicologia", short: "Psicologia", demand: "Muito alta",
    summary: "A nova NR-1, em vigor desde 26 de maio de 2026, obriga empresas a gerir riscos psicossociais. Isso levou a psicologia organizacional para o centro das empresas.",
    roles: ["Psicólogo(a) organizacional", "Psicólogo(a) clínico(a)", "Analista de riscos psicossociais", "Psicólogo(a) de RH e seleção", "Psicólogo(a) escolar"],
    hardSkills: ["Avaliação de riscos psicossociais (NR-1)", "Psicologia organizacional", "Recrutamento e seleção", "Atendimento clínico", "Atendimento on-line", "Indicadores de saúde mental"],
    softSkills: ["Escuta ativa", "Ética", "Comunicação com lideranças"],
    tools: ["Registro no CRP", "Especialização em psicologia do trabalho", "Plataformas de atendimento on-line"],
    trend: "Vagas para psicólogos cresceram 88% no primeiro semestre de 2025 segundo o BNE, e o país bate recordes de afastamentos por saúde mental.",
    start: "Estágio em RH ou saúde do trabalhador e um curso sobre a NR-1 colocam o currículo na frente.",
    indicators: { demanda: 5, tecnologia: 2, entrada: 3, remoto: 4, registro: 5 },
    jobAreas: ["Psicologia"],
    keywords: ["psicologia", "saude mental", "recrutamento", "selecao", "escuta", "nr-1", "terapia", "comportamento"],
    sources: [
      { title: "BNE: vagas para psicólogos crescem 88%", url: "https://www.bne.com.br/blog/numero-de-vagas-para-psicologos-cresce-88-no-primeiro-semestre-de-2025/" },
      { title: "CFP: NR-1 entra em vigor", url: "https://site.cfp.org.br/saude-mental-no-trabalho-cfp-destaca-avancos-da-nr-1-durante-reuniao-do-forum-dos-conselhos-federais-de-profissoes-regulamentadas/" },
      { title: "Meio & Mensagem: recorde de afastamentos por saúde mental", url: "https://www.meioemensagem.com.br/marketing/demandas-por-bem-estar-acendem-alerta-ao-mercado-de-trabalho" },
    ],
  },
  {
    id: "engenharia", name: "Engenharia", short: "Engenharia", demand: "Muito alta",
    summary: "Faltam engenheiros no Brasil, com investimento crescente em infraestrutura, energia e saneamento. Quem domina ferramentas digitais e gestão de obra se destaca.",
    roles: ["Engenheiro(a) civil", "Engenheiro(a) eletricista", "Engenheiro(a) de produção", "Engenheiro(a) de segurança de processo", "Técnico(a) de automação"],
    hardSkills: ["BIM e modelagem", "Automação industrial", "Análise de dados", "Gestão de projetos e obras", "Energias renováveis", "Normas técnicas (NR-10, NR-12)"],
    softSkills: ["Liderança de equipes", "Negociação", "Comunicação técnica"],
    tools: ["AutoCAD", "Revit", "MS Project", "Excel avançado", "Registro no Crea"],
    trend: "A CNI estima um déficit de cerca de 75 mil engenheiros, e o país forma só uns 50 mil por ano. Infraestrutura e energia puxam as vagas.",
    start: "Estágio em obra ou indústria e um curso de BIM ou automação aumentam muito a chance na primeira vaga.",
    indicators: { demanda: 5, tecnologia: 4, entrada: 3, remoto: 2, registro: 4 },
    jobAreas: ["Engenharia", "Indústria", "Manutenção"],
    keywords: ["autocad", "revit", "bim", "nr-10", "eletrica", "eletronica", "automacao", "obra", "manutencao", "multimetro", "projeto", "mecanica"],
    sources: [
      { title: "Portal Tela: falta de engenheiros ameaça crescimento", url: "https://www.portaltela.com/noticias/economia/2026/06/07/falta-de-engenheiros-ameaca-crescimento-mas-abre-oportunidades-para-jovens/" },
      { title: "Engenharia 360: engenheiros mais procurados em 2026", url: "https://engenharia360.com/os-engenheiros-mais-procurados-por-headhunters/" },
      { title: "Confea: cálculo já não basta para formar o engenheiro", url: "https://www.confea.org.br/calculo-ja-nao-basta-para-formar-o-engenheiro-do-futuro" },
    ],
  },
  {
    id: "arquitetura", name: "Arquitetura e Construção", short: "Arquitetura", demand: "Alta",
    summary: "A construção civil vive retomada em 2026 e sofre com falta de mão de obra qualificada. O BIM avança, mas a maioria dos profissionais ainda está no começo da adoção.",
    roles: ["Arquiteto(a) e urbanista", "Especialista em BIM", "Técnico(a) em segurança do trabalho", "Coordenador(a) de obras", "Arquiteto(a) de interiores"],
    hardSkills: ["BIM (Revit)", "Orçamento de obras", "Gestão de obras", "Projeto de interiores", "Construção industrializada", "Normas de desempenho e acessibilidade"],
    softSkills: ["Atendimento ao cliente", "Negociação com fornecedores", "Visão espacial"],
    tools: ["Revit", "AutoCAD", "SketchUp", "Registro no CAU", "Portfólio de projetos"],
    trend: "Técnico em segurança do trabalho é a função com mais vagas abertas na construção civil no BNE. O Confea mostra que a maioria ainda está no início da adoção do BIM.",
    start: "Um portfólio com 2 ou 3 projetos completos em BIM e noções de orçamento já diferenciam no estágio.",
    indicators: { demanda: 4, tecnologia: 3, entrada: 3, remoto: 2, registro: 4 },
    jobAreas: ["Arquitetura", "Construção"],
    keywords: ["arquitetura", "revit", "autocad", "sketchup", "bim", "obra", "orcamento", "interiores", "projeto", "construcao"],
    sources: [
      { title: "Confea: BIM avança, mas para a maioria ainda é novidade", url: "https://www.confea.org.br/bim-avanca-nos-canteiros-mas-para-maioria-ainda-e-novidade" },
      { title: "CBIC: escassez de mão de obra na construção", url: "https://cbic.org.br/escassez-de-mao-de-obra-desafia-construcao-civil-e-reforca-agenda-de-qualificacao-e-inovacao/" },
      { title: "BNE: construção civil amplia oportunidades", url: "https://www.bne.com.br/blog/construcao-civil-amplia-oportunidades-de-carreira-e-atrai-profissionais-em-busca-de-autonomia/" },
    ],
  },
  {
    id: "direito", name: "Direito", short: "Direito", demand: "Alta",
    summary: "Compliance, proteção de dados, contratos e a reforma tributária ocupam boa parte das vagas. Cresce o advogado que entende de tecnologia e de dados.",
    roles: ["Advogado(a) de compliance", "Advogado(a) tributarista", "Consultor(a) regulatório(a)", "Analista de privacidade (LGPD)", "Profissional de legal ops"],
    hardSkills: ["Proteção de dados (LGPD)", "Governança de IA", "Compliance e gestão de riscos", "Direito tributário e reforma tributária", "Automação de documentos (legal tech)", "Contratos"],
    softSkills: ["Redação clara", "Negociação", "Visão de negócio"],
    tools: ["Inscrição na OAB", "Certificações de privacidade", "Sistemas de gestão de processos"],
    trend: "Consultor(a) regulatório(a) está entre os empregos em alta do LinkedIn em 2026. Líderes jurídicos dizem pagar mais por legal tech, governança de IA e privacidade.",
    start: "Estágio em escritório com área de contratos ou compliance e um curso de LGPD já diferenciam o currículo de entrada.",
    indicators: { demanda: 4, tecnologia: 3, entrada: 3, remoto: 3, registro: 5 },
    jobAreas: ["Jurídico", "Direito", "Compliance"],
    keywords: ["direito", "juridico", "lgpd", "compliance", "contratos", "oab", "tributario", "processos", "legislacao", "peticao"],
    sources: [
      { title: "Robert Half: tendências salariais no jurídico", url: "https://www.roberthalf.com/us/en/insights/research/legal-salary-trends" },
      LINKEDIN_CARGOS,
    ],
  },
  {
    id: "financas", name: "Finanças e Contabilidade", short: "Finanças", demand: "Muito alta",
    summary: "A transição para o IBS e a CBS obriga empresas a operar dois sistemas de impostos até 2032, e faltam contadores preparados. O perfil pedido é consultivo e apoiado em dados.",
    roles: ["Analista tributário(a)", "Contador(a)", "Planejador(a) financeiro(a)", "Analista de investimentos", "Controller"],
    hardSkills: ["Reforma tributária (IBS, CBS)", "Análise financeira", "Automação de processos", "Análise de dados", "Sistemas ERP", "Letramento em IA"],
    softSkills: ["Raciocínio analítico", "Comunicação de números para decisão", "Ética"],
    tools: ["Excel avançado", "Power BI", "ERP (SAP, TOTVS)", "Registro no CRC", "Certificações CPA ou CFP"],
    trend: "Planejador(a) financeiro(a) e analista de investimentos estão entre os empregos que mais crescem. Mais da metade das empresas planeja contratar por causa da reforma tributária.",
    start: "Um curso atualizado sobre a reforma tributária e Excel avançado fazem diferença já no estágio.",
    indicators: { demanda: 5, tecnologia: 4, entrada: 3, remoto: 3, registro: 3 },
    jobAreas: ["Finanças", "Contabilidade", "Financeiro"],
    keywords: ["excel", "contabilidade", "financas", "tributario", "fiscal", "erp", "power bi", "orcamento", "custos", "auditoria", "planilhas"],
    sources: [
      { title: "Jornal Contábil: como se destacar em 2026", url: "https://jornalcontabil.com.br/noticia/contabilidade-como-se-destacar-no-mercado-em-2026/" },
      { title: "Jornal Contábil: reforma tributária e oportunidades", url: "https://www.jornalcontabil.com.br/noticia/reforma-tributaria-traz-oportunidades-de-mercado-para-o-contador/" },
      LINKEDIN_AREAS,
    ],
  },
  {
    id: "marketing", name: "Marketing", short: "Marketing", demand: "Alta",
    summary: "O mercado quer quem entende a jornada do cliente com dados e sabe contar histórias nos canais digitais, usando IA para ganhar escala.",
    roles: ["Analista de marketing digital", "Especialista em CRM", "Analista de performance", "Social media", "Analista de inteligência de mercado"],
    hardSkills: ["Jornada do cliente", "Estatística e análise de campanhas", "IA e automação de marketing", "Storytelling digital", "Gestão de orçamento", "Otimização para redes sociais"],
    softSkills: ["Criatividade", "Comunicação persuasiva", "Visão de negócio"],
    tools: ["Google Analytics", "Meta Ads", "CRM (HubSpot)", "Canva", "Planilhas"],
    trend: "As listas do LinkedIn para 2026 colocam estatística, jornada do cliente, IA e storytelling digital entre as habilidades que mais crescem em marketing.",
    start: "Gerencie uma campanha real, mesmo pequena (um negócio da família, um projeto da escola), e mostre os números no portfólio.",
    indicators: { demanda: 4, tecnologia: 5, entrada: 4, remoto: 4, registro: 1 },
    jobAreas: ["Marketing"],
    keywords: ["marketing", "meta ads", "google analytics", "redes sociais", "crm", "canva", "seo", "copywriting", "campanhas", "conteudo"],
    sources: [LINKEDIN_AREAS, { title: "Portal Tela: habilidades que vão dominar 2026 (LinkedIn)", url: "https://www.portaltela.com/economia/2026/02/24/habilidades-que-vao-dominar-o-mercado-de-trabalho-em-2026/" }],
  },
  {
    id: "vendas", name: "Vendas e Atendimento", short: "Vendas", demand: "Alta",
    summary: "Vendas e sucesso do cliente seguem entre as áreas que mais contratam. As empresas pedem quem conhece o cliente, usa dados e IA e cuida da relação depois da venda.",
    roles: ["Executivo(a) de vendas", "Gerente de sucesso do cliente", "Analista de atendimento", "Pré-vendas (SDR)", "Engenheiro(a) de aplicação e vendas"],
    hardSkills: ["Expansão de novos mercados", "Jornada do cliente", "Gestão do pipeline", "Ferramentas de IA generativa", "CRM", "Negociação"],
    softSkills: ["Empatia", "Resiliência", "Comunicação"],
    tools: ["CRM (Salesforce, HubSpot)", "Planilhas", "Ferramentas de atendimento"],
    trend: "Gerente de sucesso do cliente aparece entre os empregos em alta do LinkedIn em 2026, e engenheiro(a) de aplicação e vendas está entre os destaques da Robert Half.",
    start: "Atendimento é uma das portas de entrada mais abertas; registrar metas batidas no currículo pesa muito.",
    indicators: { demanda: 4, tecnologia: 3, entrada: 5, remoto: 3, registro: 1 },
    jobAreas: ["Vendas", "Atendimento", "Comercial"],
    keywords: ["vendas", "atendimento", "atendimento ao cliente", "negociacao", "crm", "comunicacao", "pos-venda", "prospeccao", "comercial"],
    sources: [LINKEDIN_AREAS, LINKEDIN_CARGOS, { title: "Olhar Digital: profissões em alta para 2026 (Robert Half)", url: "https://olhardigital.com.br/2025/11/05/pro/profissoes-em-alta-para-2026-salarios-setores-e-habilidades-mais-valorizadas/" }],
  },
  {
    id: "educacao", name: "Educação", short: "Educação", demand: "Estável",
    summary: "Além da formação pedagógica, as escolas pedem uso responsável de tecnologia, leitura de dados de aprendizagem e gestão de recursos.",
    roles: ["Professor(a)", "Designer instrucional", "Coordenador(a) pedagógico(a)", "Tutor(a) de ensino a distância", "Analista de T&D"],
    hardSkills: ["Letramento em IA", "Ferramentas de IA generativa", "Estatística aplicada à aprendizagem", "Orçamento e planejamento", "Design instrucional", "Avaliação"],
    softSkills: ["Escuta ativa", "Trabalho em equipe", "Didática"],
    tools: ["Ambientes virtuais (Moodle, Google Classroom)", "Canva", "Licenciatura ou pós em educação"],
    trend: "A lista Habilidades em Alta em Educação do LinkedIn para 2026 traz IA, estatística, orçamento e planejamento ao lado de escuta ativa.",
    start: "Mostre aulas ou materiais que você criou, com uma experiência de uso de IA na sala e o resultado.",
    indicators: { demanda: 3, tecnologia: 3, entrada: 4, remoto: 3, registro: 3 },
    jobAreas: ["Educação", "Ensino", "Treinamento"],
    keywords: ["didatica", "roteiro de aulas", "ensino", "educacao", "pedagogia", "aula", "canva", "moodle", "treinamento", "design instrucional"],
    sources: [
      { title: "Viva: 10 habilidades em alta na educação (LinkedIn)", url: "https://viva.com.br/carreira-e-educacao/veja-quais-sao-as-10-habilidades-em-alta-na-educacao-segundo-linkedin.html" },
      LINKEDIN_AREAS,
    ],
  },
  {
    id: "letras", name: "Letras e Tradução", short: "Letras", demand: "Em mudança",
    summary: "Docência e revisão seguem com demanda. A tradução simples perdeu espaço para a IA, e cresce a revisão especializada, a localização e a escrita para produtos digitais.",
    roles: ["Professor(a) de línguas", "Revisor(a) e editor(a)", "UX writer", "Especialista em localização", "Legendador(a)"],
    hardSkills: ["Revisão e edição de textos", "Pós-edição de tradução feita por IA", "Localização de software e jogos", "Escrita para interfaces (UX writing)", "Produção de material didático", "Linguística aplicada à IA"],
    softSkills: ["Senso crítico", "Atenção a detalhes", "Repertório cultural"],
    tools: ["Ferramentas CAT (memória de tradução)", "Editores de legenda", "Certificados de proficiência"],
    trend: "No Reino Unido, 36% dos tradutores dizem já ter perdido trabalho para a IA. O mercado editorial brasileiro trata a IA como apoio, não como substituta do julgamento humano.",
    start: "Tenha um portfólio com antes e depois de revisões e uma especialização (técnica, jurídica, jogos ou educação).",
    indicators: { demanda: 2, tecnologia: 5, entrada: 3, remoto: 5, registro: 2 },
    jobAreas: ["Letras", "Tradução"],
    keywords: ["revisao", "traducao", "ingles", "espanhol", "redacao", "escrita", "portugues", "legenda", "ux writing", "libras", "localizacao"],
    sources: [
      { title: "Correio Braziliense: tradutores e a IA (março de 2026)", url: "https://edicao.correiobraziliense.com.br/correiobraziliense/2026/03/22/1408bf/pdf/F02-TFP-2203-DIG.pdf" },
      { title: "O Povo: manual de IA da Câmara Brasileira do Livro", url: "https://mais.opovo.com.br/jornal/vidaearte/2026/07/26/arte-e-limites-da-traducao-o-valor-do-fator-humano-na-era-da-ia.html" },
      { title: "Educa Mais Brasil: Letras além da sala de aula", url: "https://www.educamaisbrasil.com.br/educacao/carreira/letras-5-areas-promissoras-para-alem-da-sala-de-aula" },
    ],
  },
  {
    id: "jornalismo", name: "Jornalismo e Comunicação", short: "Comunicação", demand: "Em mudança",
    summary: "O jornalismo acontece em várias plataformas: a mesma apuração vira texto, vídeo e podcast. Redações reduzem conteúdo genérico e investem em vídeo e áudio.",
    roles: ["Jornalista multiplataforma", "Produtor(a) de vídeo e podcast", "Jornalista de dados", "Analista de comunicação corporativa", "Checador(a) de fatos"],
    hardSkills: ["Apuração e checagem", "Edição de vídeo", "SEO", "Jornalismo de dados", "Métricas de audiência", "Roteiro para áudio e vídeo"],
    softSkills: ["Ética", "Presença em vídeo", "Rapidez com precisão"],
    tools: ["Editores de vídeo", "Google Analytics", "Ferramentas de checagem", "Planilhas"],
    trend: "No relatório do Reuters Institute, editores planejam investir em vídeo e áudio e cortar notícias gerais. Dados e SEO viraram diferencial no currículo.",
    start: "Mantenha um portfólio multiplataforma: a mesma pauta em texto, vídeo curto e áudio.",
    indicators: { demanda: 2, tecnologia: 5, entrada: 3, remoto: 4, registro: 1 },
    jobAreas: ["Comunicação", "Jornalismo", "Conteúdo"],
    keywords: ["jornalismo", "comunicacao", "redacao", "edicao de video", "seo", "podcast", "roteiro", "fotografia", "conteudo", "assessoria"],
    sources: [
      { title: "Correio Braziliense: o que o mercado busca em jornalistas", url: "https://www.correiobraziliense.com.br/aqui/?p=36780" },
      { title: "Marketeer: Reuters Institute, tendências de mídia 2026", url: "https://marketeer.sapo.pt/media-em-2026-publishers-temem-que-seja-o-fim-da-era-do-trafego-mostra-relatorio-da-reuters/" },
    ],
  },
  {
    id: "design", name: "Design e Experiência do Usuário", short: "Design", demand: "Em mudança",
    summary: "A IA acelera a produção visual, e o valor passou para pesquisa com usuários, sistemas de design e protótipos que funcionam de verdade.",
    roles: ["Product designer", "Designer de UX/UI", "Designer de sistemas (design system)", "Designer gráfico e de motion", "Pesquisador(a) de UX"],
    hardSkills: ["Pesquisa com usuários", "Prototipação", "Design systems", "Acessibilidade", "Uso de IA no processo de design", "Noções de front-end"],
    softSkills: ["Empatia", "Defender decisões com dados", "Colaboração com produto e engenharia"],
    tools: ["Figma", "Maze (testes)", "Photoshop e Illustrator", "Portfólio online"],
    trend: "Segundo a Figma, 72% dos designers já usam IA generativa. Vagas de pleno pedem Figma avançado, design system e pesquisa.",
    start: "Um estudo de caso completo, com pesquisa, protótipo testado e o que mudou depois do teste, vale mais que muitas telas bonitas.",
    indicators: { demanda: 3, tecnologia: 5, entrada: 3, remoto: 5, registro: 1 },
    jobAreas: ["Design", "UX", "Produto"],
    keywords: ["figma", "photoshop", "illustrator", "pesquisa com usuarios", "ux", "ui", "prototipo", "ilustracao", "animacao", "motion", "design", "acessibilidade"],
    sources: [
      { title: "Alura: tendências de product design 2026", url: "https://www.alura.com.br/artigos/product-design-tendencias" },
      { title: "Figma: State of the Designer 2026", url: "https://www.figma.com/pt-br/reports/state-of-the-designer-2026/" },
    ],
  },
  {
    id: "gestao", name: "Administração e RH", short: "Gestão", demand: "Alta",
    summary: "Gestão de projetos, dados e pessoas são o centro. No RH, IA, treinamento e a nova NR-1 mudaram as prioridades.",
    roles: ["Analista de RH e T&D", "Coordenador(a) de projetos", "Analista administrativo(a)", "Comprador(a)", "Analista de departamento pessoal"],
    hardSkills: ["Gestão de projetos e indicadores", "Treinamento e desenvolvimento", "Gestão administrativa", "Análise de dados", "Riscos psicossociais (NR-1)", "Letramento em IA"],
    softSkills: ["Organização", "Liderança", "Comunicação"],
    tools: ["Excel avançado", "Office 365", "Power BI", "ERP", "Metodologias ágeis"],
    trend: "A lista do LinkedIn para RH em 2026 traz IA, treinamento e desenvolvimento, Office 365 e gestão administrativa. Gestão de projetos aparece entre os grupos em alta no Brasil.",
    start: "Excel avançado e um curso curto de gestão de projetos ajudam a sair do nível auxiliar.",
    indicators: { demanda: 4, tecnologia: 3, entrada: 4, remoto: 3, registro: 1 },
    jobAreas: ["Administrativo", "Recursos Humanos", "RH", "Gestão"],
    keywords: ["excel", "organizacao", "gestao de equipes", "rh", "recrutamento", "administracao", "power bi", "projetos", "compras", "lideranca", "office"],
    sources: [LINKEDIN_AREAS, { title: "Forbes Brasil: habilidades que vão dominar 2026", url: "https://forbes.com.br/carreira/2026/02/as-habilidades-que-vao-dominar-o-mercado-de-trabalho-em-2026/" }],
  },
  {
    id: "logistica", name: "Logística e Supply Chain", short: "Logística", demand: "Alta",
    summary: "O setor ficou mais tecnológico e entrou em fase de consolidação em 2026. Paga melhor a quem interpreta dados, domina sistemas e lidera equipes.",
    roles: ["Analista de logística", "Analista de WMS", "Supervisor(a) de operações", "Comprador(a)", "Gerente de supply chain"],
    hardSkills: ["Gestão de estoques (WMS)", "Transporte (TMS)", "Análise de dados", "Planejamento de demanda", "ESG na cadeia de suprimentos", "IA aplicada à operação"],
    softSkills: ["Liderança", "Solução de problemas", "Organização"],
    tools: ["Excel avançado", "Power BI", "WMS e TMS", "ERP"],
    trend: "Segundo a ManpowerGroup, 80% das empresas no Brasil têm dificuldade para contratar com as competências certas. A automação cria vagas de analista de WMS e de dados.",
    start: "Excel avançado e um curso curto de gestão de estoques ajudam a sair do nível auxiliar.",
    indicators: { demanda: 4, tecnologia: 4, entrada: 4, remoto: 2, registro: 1 },
    jobAreas: ["Logística", "Operações", "Supply Chain"],
    keywords: ["logistica", "controle de estoque", "roteirizacao", "wms", "excel", "supply chain", "compras", "transporte", "armazem", "inventario"],
    sources: [
      { title: "Mundo Logística: perfil procurado (ManpowerGroup 2026)", url: "https://mundologistica.com.br/noticias/qual-o-perfil-do-profissional-de-logistica-que-as-empresas-procuram-hoje" },
      { title: "BNE: logística em fase de consolidação em 2026", url: "https://www.bne.com.br/blog/vagas-na-logistica-entram-em-fase-de-consolidacao-e-apontam-mercado-mais-organizado-em-2026/" },
      { title: "Vagas.com: logística em alta", url: "https://www.vagas.com.br/blog/?p=8095" },
    ],
  },
  {
    id: "agro", name: "Agronegócio", short: "Agro", demand: "Muito alta",
    summary: "O agro responde por cerca de um quarto das ocupações do país e enfrenta falta de mão de obra qualificada. A rotina nas fazendas ficou digital: máquinas conectadas, sensores e dados.",
    roles: ["Especialista em agricultura de precisão", "Cientista agrário(a)", "Técnico(a) em agricultura digital", "Agrônomo(a)", "Analista de dados no agro"],
    hardSkills: ["Agricultura de precisão", "Sensoriamento remoto e drones", "Máquinas agrícolas conectadas", "Gestão por indicadores", "ESG e bioinsumos", "Análise de dados"],
    softSkills: ["Gestão de equipes", "Resolução de problemas no campo", "Aprendizado contínuo"],
    tools: ["Registro no Crea (agronomia)", "Softwares de gestão agrícola", "Drones", "Excel"],
    trend: "Cientista agrário(a) aparece entre os empregos em alta do LinkedIn. A EY aponta a gestão de pessoas como a 2ª maior preocupação dos executivos do agro em 2026.",
    start: "Cursos técnicos em agronegócio ou agricultura digital levam rápido ao campo; drones e dados são diferenciais.",
    indicators: { demanda: 5, tecnologia: 4, entrada: 4, remoto: 1, registro: 3 },
    jobAreas: ["Agronegócio", "Agro", "Agronomia"],
    keywords: ["agro", "agronomia", "agricultura", "drone", "campo", "pecuaria", "maquinas agricolas", "solo", "safra", "zootecnia"],
    sources: [
      { title: "Band: agro responde por 26,3% do mercado de trabalho", url: "https://www.band.com.br/agro/noticias/agro-responde-por-263-do-mercado-de-trabalho-nacional-202605061158" },
      { title: "Revista Cultivar: tecnologia muda as profissões no campo", url: "https://revistacultivar.com.br/noticias/tecnologia-muda-perfil-das-profissoes-no-campo" },
      { title: "EY: busca por talentos em IA no agro", url: "https://www.ey.com/pt_br/newsroom/2026/08/busca-talentos-dominem-ia-outras-tecnologias-prioridade-agro" },
    ],
  },
  {
    id: "ambiental", name: "Meio Ambiente e Energia", short: "Ambiente", demand: "Alta",
    summary: "Os empregos verdes estão entre os destaques de 2026, puxados por energia renovável, ESG, saneamento e reciclagem. O mercado busca perfis que unem sustentabilidade e negócio.",
    roles: ["Engenheiro(a) ambiental", "Especialista em energia renovável", "Gestor(a) de sustentabilidade", "Analista de ESG", "Técnico(a) em energia solar"],
    hardSkills: ["Relatórios ESG", "Energia solar e eólica", "Licenciamento ambiental", "Inventário de carbono", "Gestão de resíduos", "Eficiência energética"],
    softSkills: ["Visão de negócio", "Comunicação com diferentes áreas", "Pensamento sistêmico"],
    tools: ["Normas ISO 14001", "Ferramentas de cálculo de emissões", "Excel", "SIG"],
    trend: "O BNE lista engenheiro ambiental, especialista em energia renovável e gestor de sustentabilidade entre as profissões em alta de 2026. O Brasil tem cerca de 10% dos empregos em renováveis do mundo.",
    start: "Curso técnico em energia solar ou um projeto de ESG em empresa júnior abre portas rapidamente.",
    indicators: { demanda: 4, tecnologia: 3, entrada: 3, remoto: 2, registro: 3 },
    jobAreas: ["Sustentabilidade", "Meio Ambiente", "Energia"],
    keywords: ["esg", "sustentabilidade", "energia", "fotovoltaico", "solar", "residuos", "meio ambiente", "carbono", "relatorios esg", "eolica"],
    sources: [
      { title: "BNE: profissões em alta em 2026 (empregos verdes)", url: "https://www.bne.com.br/blog/profissoes-em-alta-em-2026-previsoes-e-tendencias-do-mercado-de-trabalho/" },
      { title: "Meio & Mensagem: empregos verdes", url: "https://www.meioemensagem.com.br/marketing/empregos-verdes" },
      { title: "FIA: empregos verdes, exemplos e preparação", url: "https://fia.com.br/blog/empregos-verdes/" },
    ],
  },
];

export const normText = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function marketAreaById(id: string | undefined) {
  return MARKET_AREAS.find((a) => a.id === id);
}

/** Área de mercado de uma área de vaga (ex.: "Logística" → logística). */
export function marketAreaOfJobArea(jobArea: string) {
  const n = normText(jobArea);
  return MARKET_AREAS.find((a) => a.jobAreas.some((j) => normText(j) === n));
}
