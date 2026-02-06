const NotesTerms = require("../../models/settings/notesTermsModel");

exports.getNotesTermsSettings = async (req, res) => {
  try {
    const settings = await NotesTerms.findOne();

    return res.status(200).json({
      success: true,
      data: settings || {},
    });
  } catch (error) {
    console.error("Error fetching notes & terms:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notes & terms",
    });
  }
};


exports.updateNotesTermsSettings = async (req, res) => {
  try {
    const {
      footerLine1,
      footerLine2,
      notesText,
      termsText,
      loyaltyMessage,
    } = req.body;

    let settings = await NotesTerms.findOne();

    if (!settings) {
      // First time → create
      settings = new NotesTerms({
        footerLine1,
        footerLine2,
        notesText,
        termsText,
        loyaltyMessage,
      });
    } else {
      // Update existing
      if (footerLine1 !== undefined) settings.footerLine1 = footerLine1;
      if (footerLine2 !== undefined) settings.footerLine2 = footerLine2;
      if (notesText !== undefined) settings.notesText = notesText;
      if (termsText !== undefined) settings.termsText = termsText;
      if (loyaltyMessage !== undefined)
        settings.loyaltyMessage = loyaltyMessage;
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Notes & terms updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating notes & terms:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notes & terms",
    });
  }
};
