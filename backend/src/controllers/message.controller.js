import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId,io } from "../lib/socket.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const getUsersForSidebar = async(req,res) =>{
    try {
        const loggedInUseId = req.user._id;
        const filteredUsers = await User.find({_id: { $ne: loggedInUseId}}).select("-password");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.log("Error in getUsersForSidebar controller: ", error.mesage);
        res.status(500).json({message: "Internal server error"});
    }
}

export const getMessages = async(req,res) =>{
    try {
        const { id:userToChatID } = req.params
        const myId = req.user._id;

        const messages = await Message.find({
            $or:[
                {senderId:myId, receiverId:userToChatID},
                {senderId:userToChatID, receiverId:myId}
            ]
        });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller: ", error.mesage);
        res.status(500).json({message: "Internal server error"});
    }
};

export const sendMessage = async(req,res) =>{
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {

            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMesage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMesage.save();

        //socket.io;
        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",newMesage);
        }
;
        res.status(201).json(newMesage);
    } catch (error) {
        console.log("Error in sendMessages controller: ", error.mesage);
        res.status(500).json({message: "Internal server error"});
    }
};