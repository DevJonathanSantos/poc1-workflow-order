import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

function App() {
    const [pedido, setPedido] = useState("");
    const [jobId, setJobId] = useState("");
    const [resultado, setResultado] = useState("");

    useEffect(() => {
        socket.on("orderReceived", (data) => {
            setJobId(data.jobId);
            console.log("Pedido recebido no servidor:", data);
        });

        socket.on("orderProcessed", (data) => {
            setResultado(JSON.stringify(data.result));
            console.log("Pedido processado:", data);
        });

        return () => {
            socket.off("orderReceived");
            socket.off("orderProcessed");
        };
    }, []);

    const enviarPedido = () => {
        socket.emit("newOrder", { produto: pedido, quantidade: 1 });
    };

    return (
        <div style={{ padding: 20, textAlign: "center" }}>
            <h1>Pedido App - WebSocket + BullMQ</h1>
            <input
                type="text"
                placeholder="Digite seu pedido"
                value={pedido}
                onChange={(e) => setPedido(e.target.value)}
            />
            <button onClick={enviarPedido}>Enviar Pedido</button>
            {jobId && <p><strong>Job ID:</strong> {jobId}</p>}
            {resultado && <p><strong>Resultado:</strong> {resultado}</p>}
        </div>
    );
}

export default App;
