const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    constraints: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

// Static method to get setting by key
SettingsSchema.statics.getSetting = async function (key, defaultValue = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// Static method to set setting
SettingsSchema.statics.setSetting = async function (
  key,
  value,
  description = "",
  constraints = {}
) {
  return await this.findOneAndUpdate(
    { key },
    { key, value, description, constraints },
    { upsert: true, new: true }
  );
};

// Initialize default settings
SettingsSchema.statics.initDefaults = async function () {
  const defaults = [
    {
      key: "broadcast_rate_limit",
      value: 20,
      description: "Messages per second for broadcasts",
      constraints: { min: 1, max: 25 },
    },
  ];

  for (const setting of defaults) {
    await this.findOneAndUpdate({ key: setting.key }, setting, { upsert: true });
  }
};

module.exports = mongoose.model("Settings", SettingsSchema);
