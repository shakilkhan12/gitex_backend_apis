import { Settings } from "@/controllers";
import { createFAQValidator, createOrUpdateTermsPrivacyValidator, updateFAQValidator } from "@/validations";
import { Router } from "express";
const settingsRouter  = Router();
settingsRouter.post('/add-privacy-policy-terms-conditions', createOrUpdateTermsPrivacyValidator, Settings.addTermsPrivacy);
settingsRouter.put('/update-privacy-policy-terms-conditions/:id', createOrUpdateTermsPrivacyValidator, Settings.updateTermsPrivacy);
settingsRouter.post('/create-faq', createFAQValidator, Settings.create)
settingsRouter.put('/update-faq', updateFAQValidator, Settings.update)
settingsRouter.get('/get-privacy-policy-terms-conditions', Settings.getTermsPrivacy);
settingsRouter.get('/get-faqs', Settings.getAll);
settingsRouter.delete('/delete-faq/:id', Settings.delete)
export default settingsRouter