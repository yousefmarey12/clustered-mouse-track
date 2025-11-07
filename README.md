### **Clustered Mouse Track**

Clustered Mouse Track is an application that demonstrates parallel processing in Node.js. Tracking mouse activity can be a very intense task, so the workload is divided based on the amount of clients. Each client has its own separate CPU core. 

To do:
1. Open [mouse-track-backend.fly.dev/admin](https://mouse-track-backend.fly.dev/admin) **this is important to open first**
2. This should lead you to a blank light-green page with some heading test on it.
3. Open [mouse-track-backend.fly.dev/](https://mouse-track-backend.fly.dev/) on a separate tab or browser
4. Play around with the cursor a bit
5. Open the line in step 1 and a graph with mouse activity from the previous step should be displayed
6. Repeat step 3 to create more graphs.

While the primary purpose of this project was to learn Node.js Cluster Module & PM2, I learned how to create graphs with d3.js and used real-time protocols such as WebSockets.

