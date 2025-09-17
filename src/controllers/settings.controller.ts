import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { STATUS } from "@/typescript";
import { TermsPrivacyType } from "@/typescript"
import { SettingsService } from "@/services";

class Settings extends SettingsService {
  public static addTermsPrivacy = async (
    req: Request<{}, {}, TermsPrivacyType>,
    res: Response,
    next: NextFunction
  ) => {
    const errors = validationResult(req);
    try {
      if (errors.isEmpty()) {
        const termsPrivacy = await SettingsService.addTermsPrivacyService(
          req.body
        );
        return res.status(STATUS.CREATED).json(termsPrivacy);
      } else {
        return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
      }
    } catch (error) {
      next(error);
    }
  };

  public static getTermsPrivacy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const termsPrivacy = await SettingsService.getTermsPrivacyService();
      return res.status(STATUS.SUCCESS).json(termsPrivacy);
    } catch (error) {
      next(error);
    }
  };

  public static updateTermsPrivacy = async (
    req: Request<{}, {}, TermsPrivacyType>,
    res: Response,
    next: NextFunction
  ) => {
    const errors = validationResult(req);
    try {
      if (errors.isEmpty()) {
        const updated = await SettingsService.updateTermsPrivacyService(
          req.body
        );
        return res.status(STATUS.SUCCESS).json(updated);
      } else {
        return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
      }
    } catch (error) {
      next(error);
    }
  };
 static async create(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
  }

  const faqs = req.body;

  if (!Array.isArray(faqs)) {
    return res.status(STATUS.BAD_REQUEST).json({ message: "FAQs must be an array" });
  }

  try {
    const createdFaqs = await SettingsService.createFAQs(faqs);
    return res.status(STATUS.CREATED).json(createdFaqs);
  } catch (error: any) {
    next(error);
  }
}


  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const faqs = await SettingsService.getAllFAQs();
      return res.status(STATUS.SUCCESS).json(faqs);
    } catch (error: any) {
      next(error)
    }
  }

 static async update(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
  }

  const faqs = req.body;
  if (!Array.isArray(faqs)) {
    return res.status(STATUS.BAD_REQUEST).json({ message: "FAQs must be an array" });
  }
  try {
    const updatedFaqs = await SettingsService.updateFAQs(faqs);
    return res.status(STATUS.CREATED).json(updatedFaqs);
  } catch (error: any) {
    next(error);
  }
}


  static async delete(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      await SettingsService.deleteFAQ(Number(id));
      return res.status(STATUS.SUCCESS).json({ message: "FAQ deleted successfully" });
    } catch (error: any) {
      next(error)
    }
  }
}

export default Settings;
