import { PrismaClient } from "@prisma/client"
import amq from "amqplib/callback_api"
import cors from "cors"
import * as dotenv from "dotenv"
import express, { Request, Response } from "express"

dotenv.config()

amq.connect(
  "yoururl",
  (error0, connect) => {
    if (error0) {
      throw error0
    }
    connect.createChannel((error1, channel) => {
      if (error1) {
        throw error1
      }
      const server = express()
      const prisma = new PrismaClient()
      server.use(
        cors({
          origin: ["http://localhost:4994", "http://localhost:3000"],
        })
      )
      server.use(express.json())
      server.use(express.urlencoded({ extended: true }))

      server.get("/api/product", async (req: Request, res: Response) => {
        console.log("fez um get para a rota /api/product")
        const product = await prisma.product.findMany()
        channel.sendToQueue("hello", Buffer.from("hello"))
        //a gente manda a nossa queue ou fila como primeiro
        // depois a gente manda o conteudo
        return res.json(product)
      })

      server.post("/api/product", async (req: Request, res: Response) => {
        const product = req.body
        const newP = await prisma.product.create({
          data: product,
        })
        channel.sendToQueue("product_added", Buffer.from(JSON.stringify(newP)))
        return res.json(newP)
      })
      server.get("/api/product/:id", async (req: Request, res: Response) => {
        const id = req.params.id
        const product = await prisma.product.findFirst({
          where: {
            id: Number(id),
          },
        })
        return res.json(product)
      })
      const callListen = () => {
        console.log("server is running on: http://localhost:8000")
      }
      server.listen(8000, callListen)
      // antes de sair depois de fechar, a gente
      // vai desligar tambem o rabbitMQ
      process.on("beforeExit", () => {
        console.log("closing")
        connect.close()
      })
    })
  }
)
