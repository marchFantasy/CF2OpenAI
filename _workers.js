// ==================== 配置信息 ====================
// 自定义 API Key，等同 OpenAI_Api_Key，建议以"sk-"开头
let api_key = "sk-oooooooo";

// Cloudflare 账号配置，可以多配置几个账号，随机切换使用
let cf_account_array = [
  {
    account_id: "xxxxx",
    token: "workersAI api token value",
  },
];

// 当前使用的账号信息
let cf_account_id = "";
let cf_api_token = "";

// ==================== 模型映射表 ====================
// 左侧 key 为短名称（客户端使用），右侧 value 为 Cloudflare 完整模型路径
// 模型来源: https://developers.cloudflare.com/workers-ai/models/
const TEXT_GENERATION_MODELS = {
  "deepseek-coder-6.7b-base-awq": "@hf/thebloke/deepseek-coder-6.7b-base-awq",
  "deepseek-coder-6.7b-instruct-awq":
    "@hf/thebloke/deepseek-coder-6.7b-instruct-awq",
  "deepseek-math-7b-instruct": "@cf/deepseek-ai/deepseek-math-7b-instruct",
  "deepseek-r1-distill-qwen-32b":
    "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
  "discolm-german-7b-v1-awq": "@cf/thebloke/discolm-german-7b-v1-awq",
  "falcon-7b-instruct": "@cf/tiiuae/falcon-7b-instruct",
  "gemma-2b-it-lora": "@cf/google/gemma-2b-it-lora",
  "gemma-7b-it": "@hf/google/gemma-7b-it",
  "gemma-7b-it-lora": "@cf/google/gemma-7b-it-lora",
  "hermes-2-pro-mistral-7b": "@hf/nousresearch/hermes-2-pro-mistral-7b",
  "llama-2-13b-chat-awq": "@hf/thebloke/llama-2-13b-chat-awq",
  "llama-2-7b-chat-fp16": "@cf/meta/llama-2-7b-chat-fp16",
  "llama-2-7b-chat-hf-lora": "@cf/meta-llama/llama-2-7b-chat-hf-lora",
  "llama-2-7b-chat-int8": "@cf/meta/llama-2-7b-chat-int8",
  "llama-3-8b-instruct": "@cf/meta/llama-3-8b-instruct",
  "llama-3-8b-instruct-awq": "@cf/meta/llama-3-8b-instruct-awq",
  "llama-3.1-8b-instruct": "@cf/meta/llama-3.1-8b-instruct",
  "llama-3.1-8b-instruct-awq": "@cf/meta/llama-3.1-8b-instruct-awq",
  "llama-3.1-8b-instruct-fast": "@cf/meta/llama-3.1-8b-instruct-fast",
  "llama-3.1-8b-instruct-fp8": "@cf/meta/llama-3.1-8b-instruct-fp8",
  "llama-3.2-11b-vision-instruct": "@cf/meta/llama-3.2-11b-vision-instruct",
  "llama-3.2-1b-instruct": "@cf/meta/llama-3.2-1b-instruct",
  "llama-3.2-3b-instruct": "@cf/meta/llama-3.2-3b-instruct",
  "llama-3.3-70b-instruct-fp8-fast":
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "llama-4-scout-17b-16e-instruct":
    "@cf/meta/llama-4-scout-17b-16e-instruct",
  "llama-guard-3-8b": "@cf/meta/llama-guard-3-8b",
  "llamaguard-7b-awq": "@hf/thebloke/llamaguard-7b-awq",
  "meta-llama-3-8b-instruct": "@hf/meta-llama/meta-llama-3-8b-instruct",
  "mistral-7b-instruct-v0.1": "@cf/mistral/mistral-7b-instruct-v0.1",
  "mistral-7b-instruct-v0.1-awq":
    "@hf/thebloke/mistral-7b-instruct-v0.1-awq",
  "mistral-7b-instruct-v0.2": "@hf/mistral/mistral-7b-instruct-v0.2",
  "mistral-7b-instruct-v0.2-lora":
    "@cf/mistral/mistral-7b-instruct-v0.2-lora",
  "neural-chat-7b-v3-1-awq": "@hf/thebloke/neural-chat-7b-v3-1-awq",
  "openchat-3.5-0106": "@cf/openchat/openchat-3.5-0106",
  "openhermes-2.5-mistral-7b-awq":
    "@hf/thebloke/openhermes-2.5-mistral-7b-awq",
  "phi-2": "@cf/microsoft/phi-2",
  "qwen1.5-0.5b-chat": "@cf/qwen/qwen1.5-0.5b-chat",
  "qwen1.5-1.8b-chat": "@cf/qwen/qwen1.5-1.8b-chat",
  "qwen1.5-14b-chat-awq": "@cf/qwen/qwen1.5-14b-chat-awq",
  "qwen1.5-7b-chat-awq": "@cf/qwen/qwen1.5-7b-chat-awq",
  "sqlcoder-7b-2": "@cf/defog/sqlcoder-7b-2",
  "starling-lm-7b-beta": "@hf/nexusflow/starling-lm-7b-beta",
  "tinyllama-1.1b-chat-v1.0": "@cf/tinyllama/tinyllama-1.1b-chat-v1.0",
  "una-cybertron-7b-v2-bf16": "@cf/fblgit/una-cybertron-7b-v2-bf16",
  "zephyr-7b-beta-awq": "@hf/thebloke/zephyr-7b-beta-awq",
  "kimi-k2.5": "@cf/moonshotai/kimi-k2.5",
  "kimi-k2.6": "@cf/moonshotai/kimi-k2.6",
};

// 默认模型（使用上面映射表的 key）
const DEFAULT_MODEL = "llama-3.1-8b-instruct";

// ==================== 主处理函数 ====================
var worker_default = {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === "OPTIONS") {
      return handleCORS();
    }

    // 加载环境变量覆盖默认配置
    if (env.API_KEY) api_key = env.API_KEY;
    if (env.ACCOUNT_ID && env.API_TOKEN) {
      cf_account_id = env.ACCOUNT_ID;
      cf_api_token = env.API_TOKEN;
    } else {
      // 随机选择一个账号
      const randomIndex = Math.floor(Math.random() * cf_account_array.length);
      cf_account_id = cf_account_array[randomIndex].account_id;
      cf_api_token = cf_account_array[randomIndex].token;
    }

    // 验证 API Key
    if (!isAuthorized(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const url = new URL(request.url);

    // 处理模型列表请求: GET /v1/models
    if (url.pathname.endsWith("/v1/models")) {
      return handleModelsRequest();
    }

    // 处理聊天完成请求: POST /v1/chat/completions
    if (
      request.method === "POST" &&
      url.pathname.endsWith("/v1/chat/completions")
    ) {
      return handleChatCompletions(request);
    }

    return jsonResponse({ error: "Not Found" }, 404);
  },
};

// ==================== CORS 处理 ====================
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

// 返回通用的 CORS 头
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// ==================== 授权验证 ====================
function isAuthorized(request) {
  const authHeader = request.headers.get("Authorization");
  return (
    authHeader &&
    authHeader.startsWith("Bearer ") &&
    authHeader.split(" ")[1] === api_key
  );
}

// ==================== JSON 响应工具函数 ====================
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

// ==================== 模型列表 ====================
function handleModelsRequest() {
  const models = Object.keys(TEXT_GENERATION_MODELS).map((id) => ({
    id,
    object: "model",
    created: Math.floor(Date.now() / 1000),
    owned_by: "cloudflare",
  }));
  return jsonResponse({ data: models, object: "list" });
}

// ==================== 聊天完成（核心代理逻辑） ====================
async function handleChatCompletions(request) {
  try {
    const body = await request.json();

    // 映射模型名称：短名称 -> Cloudflare 完整路径
    const requestedModel = body.model || DEFAULT_MODEL;
    const cfModel =
      TEXT_GENERATION_MODELS[requestedModel] ||
      TEXT_GENERATION_MODELS[DEFAULT_MODEL] ||
      TEXT_GENERATION_MODELS[Object.keys(TEXT_GENERATION_MODELS)[0]];

    // 替换请求体中的模型名称为 Cloudflare 完整路径
    body.model = cfModel;

    // 构建 Cloudflare OpenAI 兼容端点 URL
    // 参考: https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/
    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${cf_account_id}/ai/v1/chat/completions`;

    console.log(
      `代理请求 -> 模型: ${requestedModel} => ${cfModel}, 流式: ${body.stream || false}`,
    );

    // 将请求直接代理到 Cloudflare OpenAI 兼容端点
    const cfResponse = await fetch(cfUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cf_api_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // 如果 Cloudflare 返回错误，透传错误信息
    if (!cfResponse.ok) {
      const errorText = await cfResponse.text();
      console.error(`Cloudflare API 错误: ${cfResponse.status} - ${errorText}`);
      return new Response(errorText, {
        status: cfResponse.status,
        headers: {
          "Content-Type":
            cfResponse.headers.get("Content-Type") || "application/json",
          ...corsHeaders(),
        },
      });
    }

    // 透传 Cloudflare 的响应（包括流式和非流式，Cloudflare 已原生支持 OpenAI 格式）
    const responseHeaders = {
      ...corsHeaders(),
    };

    // 保留 Cloudflare 返回的 Content-Type（流式为 text/event-stream，非流式为 application/json）
    const contentType = cfResponse.headers.get("Content-Type");
    if (contentType) {
      responseHeaders["Content-Type"] = contentType;
    }

    // 流式响应需要设置缓存控制
    if (body.stream) {
      responseHeaders["Cache-Control"] = "no-cache";
      responseHeaders["Connection"] = "keep-alive";
    }

    return new Response(cfResponse.body, {
      status: cfResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`处理请求失败: ${error.message}`);
    return jsonResponse(
      {
        error: {
          message: "Internal Server Error: " + error.message,
          type: "server_error",
          code: "internal_error",
        },
      },
      500,
    );
  }
}

export { worker_default as default };
