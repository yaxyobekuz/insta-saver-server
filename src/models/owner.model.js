const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const OwnerSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
  },
  { timestamps: true }
);

// Hash password before saving
OwnerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password method
OwnerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for full name
OwnerSchema.virtual("fullName").get(function () {
  return this.lastName ? `${this.firstName} ${this.lastName}` : this.firstName;
});

// Ensure virtuals are included in JSON
OwnerSchema.set("toJSON", { virtuals: true });
OwnerSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Owner", OwnerSchema);
