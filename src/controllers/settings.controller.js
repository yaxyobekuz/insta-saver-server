const Settings = require("../models/settings.model");

// Get all settings
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.find().lean();

    // Convert to key-value object
    const settingsObj = {};
    settings.forEach((s) => {
      settingsObj[s.key] = {
        value: s.value,
        description: s.description,
        constraints: s.constraints,
      };
    });

    res.json({
      success: true,
      data: settingsObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi",
      error: error.message,
    });
  }
};

// Update setting
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: "Qiymat talab qilinadi",
      });
    }

    // Find existing setting
    const existingSetting = await Settings.findOne({ key });

    if (!existingSetting) {
      return res.status(404).json({
        success: false,
        message: "Sozlama topilmadi",
      });
    }

    // Validate constraints
    if (existingSetting.constraints) {
      const { min, max } = existingSetting.constraints;
      const numValue = parseFloat(value);

      if (!isNaN(numValue)) {
        if (min !== null && numValue < min) {
          return res.status(400).json({
            success: false,
            message: `Qiymat ${min} dan kam bo'lmasligi kerak`,
          });
        }
        if (max !== null && numValue > max) {
          return res.status(400).json({
            success: false,
            message: `Qiymat ${max} dan oshmasligi kerak`,
          });
        }
      }
    }

    existingSetting.value = value;
    await existingSetting.save();

    res.json({
      success: true,
      message: "Sozlama yangilandi",
      data: existingSetting,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatosi",
      error: error.message,
    });
  }
};

// Initialize default settings
const initSettings = async () => {
  try {
    await Settings.initDefaults();
    console.log("Default settings initialized");
  } catch (error) {
    console.error("Error initializing settings:", error.message);
  }
};

module.exports = {
  getSettings,
  updateSetting,
  initSettings,
};
