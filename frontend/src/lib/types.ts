// === Condomínios ===
export interface Condominio {
  id: string;
  nome: string;
  cnpj: string;
  total_unidades: number;
  adimplente: boolean;
  blocos: string[];
  criado_em: string;
  atualizado_em: string;
}

// === Eleitores ===
export interface Eleitor {
  id: string;
  condominio: string;
  condominio_nome: string;
  nome: string;
  cpf_hash: string;
  bloco: string;
  apartamento: string;
  perfil: "proprietario" | "procurador";
  email: string;
  cadastro_completo: boolean;
  criado_em: string;
  atualizado_em: string;
}

// === Assembleias ===
export interface OpcaoVoto {
  id: string;
  texto: string;
  ordem: number;
  imagem_url: string | null;
  arquivo_url: string | null;
  link_externo: string;
}

export interface Questao {
  id: string;
  titulo: string;
  descricao: string;
  ordem: number;
  opcoes: OpcaoVoto[];
}

export interface Presenca {
  id: string;
  eleitor: string;
  nome: string;
  bloco: string;
  apartamento: string;
  perfil: "proprietario" | "procurador";
  metodo_auth: string;
  assinatura_facial: string;
  horario_entrada: string;
}

export interface Assembleia {
  id: string;
  condominio: string;
  condominio_nome: string;
  titulo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  status: "rascunho" | "aberta" | "encerrada";
  quorum_minimo: number;
  primeira_chamada_50_mais_1: boolean;
  quorum_segunda_chamada: number;
  segunda_chamada_qualquer_numero: boolean;
  total_votantes: number;
  total_presentes: number;
  questoes: Questao[];
  presencas: Presenca[];
  criado_em: string;
  atualizado_em: string;
}

export interface AssembleiaListItem {
  id: string;
  condominio: string;
  condominio_nome: string;
  titulo: string;
  data_inicio: string;
  data_fim: string;
  status: "rascunho" | "aberta" | "encerrada";
  quorum_minimo: number;
  primeira_chamada_50_mais_1: boolean;
  quorum_segunda_chamada: number;
  segunda_chamada_qualquer_numero: boolean;
  total_votantes: number;
  total_questoes: number;
  criado_em: string;
}

// === Votos ===
export interface VotoPayload {
  eleitor_id: string;
  questao_id: string;
  opcao_id: string;
  auth_token: string;
}

export interface VotoResponse {
  message: string;
  hash_voto: string;
  timestamp: string;
}

export interface OpcaoResultado {
  id: string;
  texto: string;
  votos: number;
}

export interface Resultado {
  questao_id: string;
  questao_titulo: string;
  total_votos: number;
  total_votantes: number;
  percentual_participacao: number;
  opcoes: OpcaoResultado[];
}

export interface RelatorioVotoItem {
  id: string;
  eleitor_nome: string;
  bloco: string;
  apartamento: string;
  perfil: "proprietario" | "procurador";
  por_procuracao: boolean;
  questao_titulo: string;
  opcao_texto: string;
  tipo_autenticacao: "facial" | "webauthn" | "otp";
  ip_address: string;
  device_info: string;
  user_agent: string;
  timestamp: string;
  hash_voto: string;
}

export interface RelatorioVotoResponse {
  assembleia_id: string;
  assembleia_titulo: string;
  total_registros: number;
  votos: RelatorioVotoItem[];
}

// === Auth ===
export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  role: "master" | "administradora" | "sindico" | null;
  condominios_ids: string[];
}

export interface MasterDashboard {
  total_usuarios: number;
  total_condominios: number;
  condominios_adimplentes: number;
  condominios_inadimplentes: number;
}

export interface MasterUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string | null;
  total_condominios: number;
  role: "master" | "administradora" | "sindico" | null;
  condominios_ids: string[];
}

// === Paginated ===
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
