const express = require("express");
const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const User = require("./models/user");


const authRoutes = require("./routes/authroutes");
const contactRoutes = require("./routes/contactroutes");
const conversationRoutes = require("./routes/conversationroutes");

const connectDB = require("./config/db");

const Message = require("./models/messages");
const Conversation = require("./models/conversationSchema");

require("dotenv").config();



app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
}));


app.use(express.json());
app.use(express.urlencoded({
    extended:true
}));

app.use(cookieParser());



// Routes

app.use("/api/auth",authRoutes);

app.use("/api/contacts",contactRoutes);

app.use("/api",conversationRoutes);






connectDB();



// HTTP SERVER

const server = http.createServer(app);



// SOCKET SERVER

const io = new Server(server,{

    cors:{
        origin:"http://localhost:5173",
        credentials:true,
    }

});
// SOCKET CONNECTION

io.on("connection",(socket)=>{
    console.log(
        "🟢 User Connected:",
        socket.id
    );

socket.on("userOnline", async (userId) => {
    try {
        socket.userId = userId;
        await User.findByIdAndUpdate(userId, {
            isOnline: true,
            lastSeen: null,
        });
        io.emit("userStatusChanged", {
            userId,
            isOnline: true,
            lastSeen: null,
        });
        console.log(`${userId} is online`);
    } catch (err) {
        console.log(err.message);
    }
});
    // JOIN CONVERSATION ROOM
    socket.on( "joinRoom",(conversationId)=>{
           socket.join(conversationId);
          console.log(
                "User joined room:",
                conversationId
            );
        }
    );
   // SEND MESSAGE

    socket.on("sendMessage",async(data)=>{
            try{
                const {conversationId,senderId,text
                } = data;
               if(
                    !conversationId || !senderId || !text?.trim())
                    {
                    console.log(
                        "Invalid message data"
                    );
                    return;
                }
                // Check conversation exists
                const conversation =await Conversation.findById(conversationId);

                if(!conversation){
                    console.log(
                        "Conversation not found"
                    );
                    return;
                }       
                         // Save Message
                const message =
                await Message.create({
                    conversation:
                    conversationId,
                    sender:
                    senderId,
                    text:
                    text.trim()

                });

                // Update last message
               conversation.lastMessage =message._id;
                await conversation.save();
                // Populate sender
                const savedMessage =
                await Message.findById(message._id) .populate
                (
                    "sender", "name email profilePic"
                );
               // Send to users in room
                io.to(conversationId)
                                .emit(
                    "receiveMessage",
                    savedMessage
                );}
            catch(error){
                console.log(
                    "Socket Error:",
                    error.message
                );
            }
      }
    );

    // DISCONNECT

  socket.on("disconnect", async () => {
    try {
        if (socket.userId) {
            const lastSeen = new Date();
            await User.findByIdAndUpdate(socket.userId, {
                isOnline: false,
                lastSeen,
            });
            io.emit("userStatusChanged", {
                userId: socket.userId,
                isOnline: false,
                lastSeen,
            });
        }
        console.log("🔴 User Disconnected:", socket.id);
    } catch (err) {
        console.log(err.message);
    }
});
});

server.listen(process.env.PORT,()=>{
       console.log(
            `🚀 Server running on ${process.env.PORT}`
        );
    }
);