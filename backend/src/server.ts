import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { Queue, Worker, QueueEvents, Job } from "bullmq";
import cors from "cors";
import { randomUUID } from "crypto";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const redisConfig = { connection: { host: "localhost", port: 6379 } };

const queue = new Queue("ORDER_QUEUE", redisConfig);
const queueEvents = new QueueEvents("ORDER_QUEUE", redisConfig);

app.use(express.json());
app.use(cors());

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  socket.on("newOrder", async (pedido) => {
    const jobId = randomUUID();
    console.log(`Novo pedido recebido:`, pedido);

    // Adiciona pedido na fila
    await queue.add("novoPedido", pedido, { jobId });

    // Notifica o cliente que o pedido foi recebido
    socket.emit("orderReceived", { success: true, jobId });

    // Aguarda a finalização do job e envia o resultado para o cliente
    queueEvents.on(
      "completed",
      async ({ jobId: completedJobId, returnvalue }) => {
        if (completedJobId === jobId) {
          socket.emit("orderProcessed", { jobId, result: returnvalue });
        }
      }
    );
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// Worker para processar os pedidos
const worker = new Worker(
  "ORDER_QUEUE",
  async (job: Job) => {
    console.log("Processando pedido:", job.data);
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Simulando processamento
    return { id: job.id, status: "Processado com sucesso", pedido: job.data };
  },
  redisConfig
);

httpServer.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
