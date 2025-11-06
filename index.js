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
    const server = http.createServer();
    setupMaster(server, {
        loadBalancingMethod: "least-connection"
    });
    setupPrimary();


    server.listen(5000, "0.0.0.0", () => {
        console.log("Server listening on port 5000")
    });



    for (let i = 0; i < numCpus.length; i++) {
        let worker = cluster.fork()

    }

    cluster.on('exit', (worker) => {
        console.log(`Worker with ${worker.process.pid} died`)
        cluster.fork()
    })
}

if (cluster.isWorker) {
    // works across all workers using @socket.io/cluster-adapter

    console.log(`Worker with Process id is running: ${process.pid}`)
    const app = express();
    app.get('/admin', (req, res) => {
        res.sendFile(path.join(__dirname, './index.html'))
    });
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'client.html'))
    });
    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: "mouse-track-backend.fly.dev",
            methods: ["GET", "POST"]
        }
    });
    io.adapter(createAdapter());
    setupWorker(io);


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

