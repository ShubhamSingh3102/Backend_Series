import mongoose,{Schema} from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        subscriber: {
            type: mongoose.Schema.Types.ObjectId, // one who is subscribing...
            ref: "User"
        },
        channel: { // ham kitne ko subscribe kiye hai....
            type: mongoose.Schema.Types.ObjectId, // one to whom is 'subscriber' is subscribing
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)


export const Subscrption = mongoose.model("Subscrption",subscriptionSchema)