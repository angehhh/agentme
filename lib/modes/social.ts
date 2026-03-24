/**
 * Modo Social: pipelines orquestados (calendario editorial + Hook Lab).
 * Equivalente conceptual a `modes/social.js` del diseño de agentes.
 */
export { runSocialEditorialAgent } from './social-editorial';
export { runSocialHookLabAgent, socialHookLabTemplatePlan, type SocialHookLabAgentState, type SocialHookLabPipelineCtx, } from './social-hook-pipeline';
