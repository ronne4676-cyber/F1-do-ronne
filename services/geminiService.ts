
import { GoogleGenAI } from "@google/genai";
import { RaceResult, Team } from "../types";

// Para usar sua chave diretamente: substitua process.env.API_KEY por "SUA_CHAVE_AQUI"
// Exemplo: const ai = new GoogleGenAI({ apiKey: "AIza..." });
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateRaceCommentary(results: RaceResult[], teamName: string): Promise<string> {
  try {
    const summary = results.slice(0, 3).map(r => `${r.position}. ${r.teamName}`).join(", ");
    const userResult = results.find(r => r.teamName === teamName);
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere um resumo de corrida de F1 de alta octanagem em português (Brasil), com no máximo 2 sentenças. O pódio foi: ${summary}. Sua equipe, ${teamName}, terminou em P${userResult?.position}. Fale sobre a intensidade e o que isso significa para o campeonato.`,
      config: {
        temperature: 0.8,
        maxOutputTokens: 150,
      }
    });

    return response.text || "Uma corrida incrível chega ao fim com surpresas em todo o grid!";
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "A bandeira quadriculada cai em uma tarde histórica de automobilismo!";
  }
}

export async function conductBandInterview(results: RaceResult[], team: Team): Promise<string> {
  try {
    const userResult = results.find(r => r.teamId === team.id);
    const context = `
      Equipe: ${team.name}
      Posição Final: P${userResult?.position}
      Desgaste de Pneus ao final: ${userResult?.tireWear.toFixed(1)}%
      Estado do Motor: ${userResult?.engineCondition.toFixed(1)}%
      Pilotos: ${team.drivers.map(d => d.name).join(' e ')}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é uma repórter de F1 da Band (estilo Mariana Becker). Entreviste o chefe de equipe da ${team.name} após a corrida. 
      Seja profissional, direta e mencione detalhes técnicos como o desgaste de pneus ou motor se foram críticos. 
      O tom deve ser de transmissão de TV brasileira. Responda em português. Máximo 80 palavras. Contexto: ${context}`,
      config: {
        temperature: 0.9,
      }
    });

    return response.text || "Chefe, o que faltou hoje para buscar esse pódio?";
  } catch (error) {
    return "Estamos aqui no paddock, mas o sinal está instável. Voltamos com vocês no estúdio!";
  }
}

export async function generatePenaltyReport(teamName: string, reason: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Escreva um relatório formal dos Comissários da FIA em português (Brasil) para a equipe ${teamName} recebendo uma punição por: ${reason}. Faça parecer oficial e profissional. Máximo 30 palavras.`,
      config: {
        temperature: 0.5,
        maxOutputTokens: 100,
      }
    });
    return response.text || `Os Comissários investigaram e consideraram a ${teamName} em violação dos regulamentos técnicos.`;
  } catch (error) {
    return `Infração técnica detectada pela FIA para a equipe ${teamName}.`;
  }
}
