import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    tgId:{
        type: String,
        Required: true,
    },

    firstName:{
        type: String,
        required: true,
    },

    lastName:{
        type: String,
        required: true,
    },

    username:{
        type: String,
        required: true,
        unique: true,
    },

    isBot:{
        type: Boolean,
        required: true,
    },

    promptToken:{
         type: Number,
         required: false,
     },
    },
    {timestamps : true}
);

export default mongoose.model('User', userSchema);