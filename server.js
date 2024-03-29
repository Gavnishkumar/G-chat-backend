const express= require('express');
const dotenv= require('dotenv');
const chats=require('./data/data');
const connectDB = require('./config/db');
const router = require('./Route/userRoutes');
const userRoutes= require('./Route/userRoutes');
const ChatRoutes= require('./Route/ChatRoutes')
const messageRoutes= require('./Route/messageRoutes');
const path= require('path');
const ImageKit = require('imagekit');
const cors= require('cors')
const app= express();
app.use(express.json());
app.use(cors({
    origin: '*',
    credentials:false
}));
dotenv.config();
connectDB();
const imagekit = new ImageKit({
    urlEndpoint: process.env.UrlEndPoint,
    publicKey:process.env.PublicKey,
    privateKey: process.env.PrivateKey
  });
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://g-chat-client.onrender.com");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials: true")
    next();
});

app.get('/',(req,res)=>{
    res.send("server is running");
})
app.use('/api/user',userRoutes);
app.use('/api/chats',ChatRoutes);
app.use('/api/message',messageRoutes);
app.get('/imageauth',(req, res)=> {
    var result = imagekit.getAuthenticationParameters();
    res.send(result);
  });
const PORT=process.env.PORT || 5000;
const server=app.listen(PORT,()=>{
    console.log(`server is started at ${PORT}`);
})
const io=require('socket.io')(server,{
    pingTimeout: 60000,
    cors:{
        origin:"*",
    },
});
io.on("connection",(socket)=>{
    // console.log("socket.io connected successfully");
    socket.on('setup',(userData)=>{
        socket.join(userData.data._id);
       
        socket.emit("connected");
    })
    socket.on("join chat",(room)=>{
        socket.join(room)
        // console.log("user joined room "+ room);
    })
    socket.on('typing',(room)=>socket.in(room).emit("typing"));
    socket.on('stop typing',(room)=>socket.in(room).emit("stop typing"));
    socket.on('new message',(newMessageReceived)=>{
        var chat= newMessageReceived.chat;
     
        if(!chat.users) return console.log('chat.user is not defined');
        chat.users.map((user)=>{
            if(user._id == newMessageReceived.sender._id) return;
            socket.in(user._id).emit('message received',newMessageReceived)
        }

        )
    })
})