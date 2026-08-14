import express from "express";
import path from "path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body parser limits to allow large PDF base64 payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: "firestore_active" });
});

// Proxy route for Editora NPE logo to avoid CORS and load timing issues during pdf generation
app.get("/api/logo-npe", async (req, res) => {
  try {
    const imageUrl = "https://editoranpe.com.br/wp-content/uploads/2026/06/Logo-Editora-NPE-scaled.png";
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch logo: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day
    res.setHeader("Access-Control-Allow-Origin", "*"); // Fully permissive CORS
    return res.send(Buffer.from(buffer));
  } catch (error: any) {
    console.error("[Server] Erro ao buscar logotipo:", error);
    return res.status(500).send("Error fetching logo");
  }
});

// Endpoint to check if WhatsApp Evolution API credentials are set
app.get("/api/check-whatsapp-config", (req, res) => {
  try {
    const isUrlConfigured = !!process.env.EVOLUTION_API_URL;
    const isKeyConfigured = !!process.env.EVOLUTION_API_KEY;
    const isInstanceConfigured = !!process.env.EVOLUTION_API_INSTANCE;

    console.log(`[Server] Validando configurações da Evolution API: URL=${isUrlConfigured}, KEY=${isKeyConfigured}, INSTANCE=${isInstanceConfigured}`);

    let resolvedInstance = process.env.EVOLUTION_API_INSTANCE || "EditoraNPE2";
    let resolvedKey = process.env.EVOLUTION_API_KEY || "1E854FFD3939-4236-845F-2936F8B0D2DE";

    if (resolvedInstance === resolvedKey || (resolvedInstance.includes("-") && resolvedInstance.length === 35)) {
      console.warn(`[Server] AUTO-HEALING (check-config): A instância informada é idêntica à API Key (ou parece ser uma chave). Usando a instância padrão "EditoraNPE2".`);
    }

    return res.json({ configured: true });
  } catch (error: any) {
    console.error("[Server] Erro ao verificar configuração do WhatsApp:", error);
    return res.status(500).json({
      configured: false,
      error: `Erro interno ao verificar configuração: ${error?.message || "Erro desconhecido"}`
    });
  }
});

// Secure endpoint to inspect environment variable states
app.get("/api/debug-env", (req, res) => {
  const mask = (str: string | undefined) => {
    if (!str) return "UNDEFINED";
    if (str.length <= 6) return "***";
    return `${str.substring(0, 3)}...${str.substring(str.length - 3)}`;
  };
  res.json({
    EVOLUTION_API_URL: mask(process.env.EVOLUTION_API_URL),
    EVOLUTION_API_KEY: mask(process.env.EVOLUTION_API_KEY),
    EVOLUTION_API_INSTANCE: mask(process.env.EVOLUTION_API_INSTANCE),
    raw_lengths: {
      url: process.env.EVOLUTION_API_URL?.length || 0,
      key: process.env.EVOLUTION_API_KEY?.length || 0,
      instance: process.env.EVOLUTION_API_INSTANCE?.length || 0,
    }
  });
});

// Proxy route for sending proposals via Evolution API (WhatsApp)
app.post("/api/send-proposal", async (req, res) => {
  try {
    const { number, media, fileName, caption, config } = req.body;

    if (!number || !media) {
      return res.status(400).json({ error: "Parâmetros 'number' e 'media' são obrigatórios." });
    }

    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    console.log(`[Server] Recebido envio de proposta para ${number} (Arquivo: ${fileName}) de IP: ${clientIp}`);

    // Load with robust fallbacks: dynamic config > process.env > defaults
    const evoApiKey = (config?.apiKey || process.env.EVOLUTION_API_KEY || "1E854FFD3939-4236-845F-2936F8B0D2DE").trim();
    let evoInstance = (config?.instanceName || process.env.EVOLUTION_API_INSTANCE || "EditoraNPE2").trim();
    let evoApiUrl = (config?.apiUrl || process.env.EVOLUTION_API_URL || "https://evoapi.agentenpe.com.br").trim();

    // Auto-healing logic: If they mistakenly configured instance as the API key or if it looks like a key (e.g. contains dashes, is 35 chars long), let's fall back to "EditoraNPE2"
    if (evoInstance === evoApiKey || (evoInstance.includes("-") && evoInstance.length === 35)) {
      console.warn(`[Server] AUTO-HEALING (send-proposal): EVOLUTION_API_INSTANCE set to "${evoInstance}", which appears to be the API Key itself. Falling back to default instance "EditoraNPE2".`);
      evoInstance = "EditoraNPE2";
    }

    // If EVOLUTION_API_URL doesn't contain /message/sendMedia, format it dynamically
    if (!evoApiUrl.includes("/message/sendMedia")) {
      const baseUrl = evoApiUrl.replace(/\/$/, ""); // Strip trailing slash
      evoApiUrl = `${baseUrl}/message/sendMedia/${evoInstance}`;
    }

    const payload = {
      number,
      mediatype: "document",
      media,
      fileName,
      caption
    };

    console.log(`[Server] Repassando requisição para Evolution API em: ${evoApiUrl}`);

    const response = await fetch(evoApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": evoApiKey
      },
      body: JSON.stringify(payload)
    });

    const responseStatus = response.status;
    const responseText = await response.text();

    console.log(`[Server] Resposta da Evolution API (${responseStatus}): ${responseText.substring(0, 500)}`);

    if (!response.ok) {
      return res.status(responseStatus).json({
        error: `Erro retornado pela Evolution API (${responseStatus}): ${responseText}`
      });
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { rawResponse: responseText };
    }

    return res.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error("[Server] Falha crítica ao enviar proposta por WhatsApp:", error);
    return res.status(500).json({
      error: `Erro interno no servidor ao processar o envio: ${error?.message || "Erro desconhecido"}`
    });
  }
});

// Proxy route for sending proposals via E-mail (SMTP)
app.post("/api/send-proposal-email", async (req, res) => {
  try {
    const { to, media, fileName, subject, body, config } = req.body;

    if (!to || !media) {
      return res.status(400).json({ error: "Parâmetros 'to' e 'media' são obrigatórios." });
    }

    if (!config || !config.smtpHost || !config.smtpUser || !config.smtpPass) {
      return res.status(400).json({ error: "Configurações do servidor de e-mail (SMTP) não fornecidas ou incompletas." });
    }

    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    console.log(`[Server] Recebido envio de e-mail para ${to} (Arquivo: ${fileName}) de IP: ${clientIp}`);

    const host = config.smtpHost.trim();
    const port = parseInt(config.smtpPort) || 587;
    // Direct SSL/TLS (secure: true) should only be used for port 465. 
    // Other ports like 587 use STARTTLS, which requires secure: false in nodemailer.
    const secure = port === 465;
    const user = config.smtpUser.trim();
    const pass = config.smtpPass;
    const from = (config.smtpFrom || user).trim();

    console.log(`[Server] Enviando proposta via SMTP (${host}:${port}, SSL=${secure}) de ${from} para ${to}`);

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false // Bypasses self-signed SSL cert checks in certain hosting servers
      }
    });

    // Strip prefix like data:application/pdf;base64,
    const base64Data = media.includes("base64,") ? media.split("base64,")[1] : media;
    const pdfBuffer = Buffer.from(base64Data, "base64");

    const mailOptions = {
      from,
      to,
      subject: subject || "Proposta Comercial NPE",
      text: body || "Olá, segue em anexo a proposta comercial solicitada.",
      attachments: [
        {
          filename: fileName || "proposta.pdf",
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Server] E-mail enviado com sucesso! MessageID: ${info.messageId}`);

    return res.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("[Server] Falha ao enviar e-mail via SMTP:", error);
    let errorMsg = error?.message || "Erro desconhecido";
    if (errorMsg.includes("535") || errorMsg.toLowerCase().includes("accepted") || errorMsg.toLowerCase().includes("username and password not accepted")) {
      errorMsg = "Login rejeitado (535). Se estiver usando o Gmail (smtp.gmail.com), você DEVE criar e usar uma 'Senha de App' (App Password) de 16 dígitos nas configurações de segurança de sua Conta Google e colocá-la no campo 'Senha' em vez da senha normal da sua conta.";
    }
    return res.status(500).json({
      error: `Falha ao enviar e-mail via SMTP: ${errorMsg}`
    });
  }
});

// Proxy route for testing E-mail (SMTP) connection
app.post("/api/test-email", async (req, res) => {
  try {
    const { config } = req.body;
    if (!config || !config.smtpHost || !config.smtpUser || !config.smtpPass) {
      return res.status(400).json({ error: "Configurações de SMTP incompletas para realizar o teste." });
    }

    const host = config.smtpHost.trim();
    const port = parseInt(config.smtpPort) || 587;
    // Direct SSL/TLS (secure: true) should only be used for port 465. 
    // Other ports like 587 use STARTTLS, which requires secure: false in nodemailer.
    const secure = port === 465;
    const user = config.smtpUser.trim();
    const pass = config.smtpPass;

    console.log(`[Server] Testando conexão SMTP com ${host}:${port} para o usuário ${user}...`);

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();
    console.log("[Server] Teste SMTP bem-sucedido!");
    return res.json({ success: true, message: "Conexão com o servidor de E-mail (SMTP) estabelecida com sucesso!" });
  } catch (error: any) {
    console.error("[Server] Erro no teste SMTP:", error);
    let errorMsg = error?.message || "Erro desconhecido";
    if (errorMsg.includes("535") || errorMsg.toLowerCase().includes("accepted") || errorMsg.toLowerCase().includes("username and password not accepted")) {
      errorMsg = "Login rejeitado (535). Se estiver usando o Gmail (smtp.gmail.com), você DEVE criar e usar uma 'Senha de App' (App Password) de 16 dígitos nas configurações de segurança de sua Conta Google e colocá-la no campo 'Senha' em vez da senha normal da sua conta.";
    }
    return res.status(500).json({
      error: `Falha na conexão SMTP: ${errorMsg}`
    });
  }
});

// Proxy route for testing WhatsApp (Evolution API) connection
app.post("/api/test-whatsapp", async (req, res) => {
  try {
    const { config } = req.body;
    if (!config || !config.apiUrl || !config.apiKey || !config.instanceName) {
      return res.status(400).json({ error: "Configurações do WhatsApp (Evolution API) incompletas para realizar o teste." });
    }

    const rawUrl = config.apiUrl.trim();
    const apiKey = config.apiKey.trim();
    const instance = config.instanceName.trim();

    // Query state endpoint of Evolution API
    const baseUrl = rawUrl.replace(/\/$/, "");
    const testUrl = `${baseUrl}/instance/connectionState/${instance}`;

    console.log(`[Server] Testando conexão WhatsApp com a Evolution API em: ${testUrl}`);

    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        "apikey": apiKey
      }
    });

    const responseStatus = response.status;
    const responseText = await response.text();

    console.log(`[Server] Resposta do teste WhatsApp (${responseStatus}): ${responseText}`);

    if (!response.ok) {
      return res.status(responseStatus).json({
        error: `O servidor Evolution API retornou o erro (${responseStatus}): ${responseText}`
      });
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { rawResponse: responseText };
    }

    return res.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error("[Server] Erro no teste do WhatsApp:", error);
    return res.status(500).json({
      error: `Falha ao tentar se conectar com a Evolution API: ${error?.message || "Erro desconhecido"}`
    });
  }
});

// Vite middleware development / production serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] rodando em http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
