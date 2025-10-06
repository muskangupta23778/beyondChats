import OpenAI from "openai";

// Azure OpenAI via OpenAI SDK
// Required env (create frontend/.env):
//   REACT_APP_AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com
//   REACT_APP_AZURE_OPENAI_API_KEY=<key>
//   REACT_APP_AZURE_OPENAI_API_VERSION=2024-06-01
//   REACT_APP_AZURE_OPENAI_DEPLOYMENT=<your-deployment-name>
const endpoint = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY;
const apiVersion = process.env.REACT_APP_AZURE_OPENAI_API_VERSION || "2024-06-01";
const defaultDeployment = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT || "gpt-4o-mini"; // must match your deployment NAME

// Use baseURL ending with /openai. Provide api-version via defaultQuery and api-key header.
const openai = new OpenAI({
  apiKey, // used by SDK; Azure also requires api-key header
  baseURL: endpoint ? `${endpoint.replace(/\/$/, "")}/openai` : undefined,
  defaultHeaders: apiKey ? { "api-key": apiKey } : undefined,
  defaultQuery: { "api-version": apiVersion },
  dangerouslyAllowBrowser: true, // only use in development; proxy via server for production
});
export const getEndpoint = () => {
  return endpoint;
}
export async function generateResponse(
  input,
  { deployment = defaultDeployment } = {}
) {
    console.log(endpoint);
  if (!input || typeof input !== "string") {
    throw new Error('generateResponse: "input" must be a non-empty string');
  }
  if (!endpoint || !apiKey) {
    throw new Error("Azure OpenAI endpoint/apiKey missing. Set env vars in frontend/.env");
  }

  const response = await openai.chat.completions.create({
    model: deployment, // deployment NAME from Azure portal
    messages: [{ role: "user", content: input }],
  });

  return response.choices?.[0]?.message?.content ?? "";
}

export default {
  generateResponse,
};
