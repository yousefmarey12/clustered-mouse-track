let express = require("express");
let cors = require("cors");
let path = require("path");
let fs = require("fs");
let uuid = require("uuid");
let cluster = require("node:cluster");
let os = require("os");
let http = require("http");

const { setupMaster, setupWorker } = require("@socket.io/sticky");
const { Server } = require("socket.io");
const { setupPrimary, createAdapter } = require("@socket.io/cluster-adapter");

let numCpus = os.cpus();


if (cluster.isPrimary) {


    const httpServer = http.createServer();


    setupMaster(httpServer, {
        loadBalancingMethod: "least-connection",
    });

    setupPrimary();

    httpServer.listen(8080, "0.0.0.0", () => {
        console.log("Primary listening on 8080");
    });

    for (let i = 0; i < numCpus.length; i++) {
        cluster.fork();
    }

    cluster.on("exit", worker => {
        console.log(`Worker ${worker.process.pid} died. Restarting.`);
        cluster.fork();
    });

    return;
}
else {
    console.log(`Worker ${process.pid} starting`);

    const app = express();
    app.use(cors());

    app.get("/admin", (req, res) => {
        res.sendFile(path.join(__dirname, "index.html"));
    });
    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "client.html"));
    });

    const httpServer = http.createServer(app);

    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.adapter(createAdapter());


    setupWorker(io);

    httpServer.listen(0, "0.0.0.0");


    io.of("/client").on("connection", socket => {
        if (socket.recovered) {
            let obj = {
                id: socket.id,
                line: socket.data.line ? socket.data.line : [],
                count: socket.data.line && socket.data.line[socket.data.line.length - 1].count ? ssocket.data.line[socket.data.line.length - 1].count : 0,
                date: Date.now(),
            };
            let interval = setInterval(() => {
                let snapshot = { ...obj }
                io.of("/admin").emit("updateUser", snapshot);
                obj.count = 0;
                obj.date = Date.now();
            }, 1000);
            socket.on("mouse_move", () => {
                console.log("Mouse Moved")
                obj.count++;
            });
            socket.on("line", connection => {
                obj.line = connection.obj;
            });
            socket.on("disconnect", () => {
                io.of("/admin").emit("removeUser", obj.id);
                clearInterval(interval);
            });
        }
        else {
            let obj = {
                id: socket.id,
                line: [],
                count: 0,
                date: Date.now(),
            };
            io.of("/admin").emit("addUser", obj);


            let interval = setInterval(() => {
                let snapshot = { ...obj }
                io.of("/admin").emit("updateUser", snapshot);
                obj.count = 0;
                obj.date = Date.now();
            }, 1000);
            socket.on("mouse_move", () => {
                console.log("Mouse Moved")
                console.log("obj in event is")
                obj.count++;
                console.log(obj)
            });

            socket.on("line", connection => {
                obj.line = connection.obj;
                socket.data.line = connection.obj
            });

            socket.on("disconnect", () => {
                io.of("/admin").emit("removeUser", obj.id);
                clearInterval(interval);
            });
        }



    });

    io.of("/admin").on("connection", socket => {
        console.log("Admin connected");
    });

}


