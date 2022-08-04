const mongoose = require("mongoose")

const OrderSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true,
        trim: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            require: true,
            trim: true
        },
        quantity: {
            type: Number,
            require: true,
            trim: true
        }
    }],
    totalPrice: {
        type: Number,
        require: true,
        trim: true
    },
    totalItems: {
        type: Number,
        require: true,
        trim: true
    },
    totalQuantity: {
        type: Number,
        require: true,
        trim: true
    },
    cancellable: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ["pending", "completed", "cancled"]
    },
    deletedAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
}, { timestamps: true })

module.exports = mongoose.model("Order", OrderSchema)