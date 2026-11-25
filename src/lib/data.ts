export type Course = { id: string; title: string; subject: string; teacher: string; hours: number; level: string; description: string; modules: string[] };
export const courses: Course[] = [
  { id: "alfabetizacao-digital", title: "Alfabetização Digital", subject: "Tecnologia", teacher: "Profa. Ana Souza", hours: 20, level: "Fundamental", description: "Aprenda a usar computadores, internet e ferramentas digitais com segurança.", modules: ["O computador e seus componentes", "Navegação segura na internet", "Editores de texto", "Cidadania digital"] },
  { id: "matematica-basica", title: "Matemática para a Vida", subject: "Matemática", teacher: "Prof. Carlos Lima", hours: 30, level: "Fundamental", description: "Frações, porcentagem e educação financeira aplicadas ao cotidiano.", modules: ["Números e operações", "Frações e porcentagem", "Educação financeira", "Resolução de problemas"] },
  { id: "redacao", title: "Leitura e Redação", subject: "Português", teacher: "Profa. Beatriz Rocha", hours: 25, level: "Médio", description: "Interpretação de textos e produção de redações argumentativas.", modules: ["Gêneros textuais", "Coesão e coerência", "Texto dissertativo", "Revisão e reescrita"] },
  { id: "sustentabilidade", title: "Educação para a Sustentabilidade", subject: "Ciências", teacher: "Prof. Diego Martins", hours: 15, level: "Todos", description: "Os 17 ODS, meio ambiente e consumo consciente.", modules: ["Agenda 2030", "Clima e biodiversidade", "Consumo consciente", "Projeto comunitário"] },
  { id: "historia-brasil", title: "História do Brasil", subject: "História", teacher: "Profa. Elisa Nunes", hours: 28, level: "Médio", description: "Da colonização à redemocratização, com foco em direitos e cidadania.", modules: ["Brasil colonial", "Império", "República", "Constituição de 1988"] },
  { id: "ingles", title: "Inglês Básico", subject: "Línguas", teacher: "Prof. Felipe Alves", hours: 40, level: "Fundamental", description: "Vocabulário, conversação e compreensão para iniciantes.", modules: ["Greetings", "Daily routine", "Simple present", "Conversation practice"] },
];
export type Material = {
  id: string;
  title: string;
  type: string;
  subject: string;
  level: string;
  author: string;
  courseId: string;
  lessonIndex: number;
};
export const materials: Material[] = [
  { id: "m1", title: "Guia de Educação Inclusiva", type: "Guia pedagógico", subject: "Pedagogia", level: "Docentes", author: "UNESCO (adaptado)", courseId: "sustentabilidade", lessonIndex: 3 },
  { id: "m2", title: "Apostila de Frações", type: "Apostila", subject: "Matemática", level: "Fundamental", author: "Prof. Carlos Lima", courseId: "matematica-basica", lessonIndex: 1 },
  { id: "m3", title: "Dom Casmurro", type: "Livro digital", subject: "Português", level: "Médio", author: "Machado de Assis (domínio público)", courseId: "redacao", lessonIndex: 0 },
  { id: "m4", title: "Educação e desigualdade no Brasil", type: "Artigo científico", subject: "Sociologia", level: "Superior", author: "Revista Educação & Sociedade", courseId: "historia-brasil", lessonIndex: 3 },
  { id: "m5", title: "Videoaula: Ciclo da água", type: "Videoaula", subject: "Ciências", level: "Fundamental", author: "Prof. Diego Martins", courseId: "sustentabilidade", lessonIndex: 1 },
  { id: "m6", title: "Mapas da Agenda 2030", type: "Material didático", subject: "Geografia", level: "Médio", author: "ONU Brasil (adaptado)", courseId: "sustentabilidade", lessonIndex: 0 },
  { id: "m7", title: "Os Lusíadas", type: "Livro digital", subject: "Português", level: "Médio", author: "Luís de Camões (domínio público)", courseId: "redacao", lessonIndex: 1 },
  { id: "m8", title: "Podcast: Aprender ao longo da vida", type: "Podcast", subject: "Pedagogia", level: "Todos", author: "Equipe Aprender Juntos", courseId: "alfabetizacao-digital", lessonIndex: 3 },
];
export const odsTargets = [
  ["4.1", "Garantir que todos completem o ensino primário e secundário gratuito, equitativo e de qualidade."],
  ["4.2", "Assegurar acesso a desenvolvimento de qualidade na primeira infância e educação pré-escolar."],
  ["4.3", "Garantir acesso igualitário à educação técnica, profissional e superior de qualidade."],
  ["4.4", "Aumentar o número de jovens e adultos com habilidades para emprego e empreendedorismo."],
  ["4.5", "Eliminar disparidades de gênero e garantir acesso a pessoas vulneráveis e com deficiência."],
  ["4.6", "Garantir que todos os jovens e grande parte dos adultos estejam alfabetizados."],
  ["4.7", "Garantir conhecimentos para promover o desenvolvimento sustentável e a cidadania global."],
  ["4.a", "Construir e melhorar instalações físicas sensíveis às crianças, à deficiência e ao gênero."],
  ["4.b", "Ampliar o número de bolsas de estudo para países em desenvolvimento."],
  ["4.c", "Aumentar o contingente de professores qualificados, inclusive por cooperação internacional."],
];
