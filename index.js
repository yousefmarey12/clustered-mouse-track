let express = require('express')
let cors = require('cors')
let path = require('path')
let fs = require('fs')
let uuid = require('uuid')
let cluster = require('node:cluster')
let os = require('os')
let app = express(cors())
let http = require('http')
const { setupMaster, setupWorker } = require("@socket.io/sticky");
const { Server } = require('socket.io');
const { setupPrimary, createAdapter } = require('@socket.io/cluster-adapter')


let numCpus = os.cpus()

if (cluster.isPrimary) {

    setupPrimary();

    // Fork workers
    for (let i = 0; i < numCpus.length; i++) {
        cluster.fork();
    }

    cluster.on("exit", worker => {
        console.log(`Worker ${worker.process.pid} died. Restarting.`);
        cluster.fork();
    });

    return; // IMPORTANT: Primary should not run a server
}

if (cluster.isWorker) {
    // works across all workers using @socket.io/cluster-adapter

    console.log(`Worker with Process id is running: ${process.pid}`)
    const app = express();
    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: "https://mouse-track-backend.fly.dev",
            methods: ["GET", "POST"]
        }
    });

    httpServer.listen(5000, "0.0.0.0");
    app.get('/admin', (req, res) => {
        res.sendFile(path.join(__dirname, './index.html'))
    });
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'client.html'))
    });

    setupWorker(io);
    io.adapter(createAdapter());



    let addGraph = (socket, obj) => {
        socket.emit('addUser', obj)
    }
    let removeGraph = (socket, id) => {
        console.log("Here is it removed")
        socket.emit('removeUser', id)
    }
    let updateGraph = (socket, obj) => {
        socket.emit('updateUser', obj)
    }

    io.of('/admin').on('removeUser', obj => {

    })
    io.of('/admin').on('addUser', () => { })
    io.of('/admin').on('connection', socket => {

    })

    io.of('/client').on('connection', socket => {
        let obj = Object.create(null)
        obj.line = []
        obj.count = 0
        obj.date = Date.now()
        obj.id = uuid.v4()
        io.of('/admin').emit('addUser', obj)

        let interval = setInterval(() => {

            io.of('/admin').emit('updateUser', obj)
            obj.count = 0
            obj.date = Date.now()

        }, 1000)



        socket.on('mouse_move', () => {

            obj.count++
        })

        socket.on('line', connection => {
            let line = connection.obj
            obj.line = line
        })

        socket.on('disconnect', () => {
            io.of('/admin').emit('removeUser', obj.id)
            interval.close()
        })


    })



}

