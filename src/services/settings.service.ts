import db from "@/prisma/client";
import { STATUS, TermsPrivacyType } from "@/typescript";
import { HttpException } from "@/utils/HttpException.utils";

class TermsPrivacyService {
  // ✅ Add Terms & Privacy
  protected static addTermsPrivacyService = async (data: TermsPrivacyType) => {

    const existing = await db.termsPrivacy.findFirst();
    if (existing) {
      throw new HttpException(
        STATUS.BAD_REQUEST,
        "Terms & Privacy already exists. Please update instead."
      );
    }

    const result = await db.termsPrivacy.create({
      data: { ...data, createdAt: new Date() },
    });
    return result;
  };

  // ✅ Get Terms & Privacy
  protected static getTermsPrivacyService = async () => {
    const termsPrivacy = await db.termsPrivacy.findFirst();
    if (!termsPrivacy) {
      throw new HttpException(
        STATUS.NOT_FOUND,
        "No Terms & Privacy found in database"
      );
    }
    return termsPrivacy;
  };

  // ✅ Update Terms & Privacy
  protected static updateTermsPrivacyService = async (
    data: TermsPrivacyType
  ) => {
    const existing = await db.termsPrivacy.findFirst();
    if (!existing) {
      throw new HttpException(
        STATUS.NOT_FOUND,
        "No Terms & Privacy found to update"
      );
    }

    const result = await db.termsPrivacy.update({
      where: { id: existing.id },
      data: {
        terms: data.terms,
        privacyPolicy: data.privacyPolicy,
        updatedAt: new Date(),
      },
    });
    return result;
  };
static async createFAQs(faqs: { question: string; answer: string }[]) {
  return await db.fAQ.createMany({
    data: faqs.map(faq => ({
      question: faq.question,
      answer: faq.answer
    }))
  });
}


  static async getAllFAQs() {
    return await db.fAQ.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

static async updateFAQs(
  faqs: { id?: number; question: string; answer: string }[]
) {
  const result = await Promise.all(
    faqs.map(faq => {
      if (faq.id) {
        // Update existing
        return db.fAQ.update({
          where: { id: faq.id },
          data: {
            question: faq.question,
            answer: faq.answer,
          }
        });
      } else {
        // Create new
        return db.fAQ.create({
          data: {
            question: faq.question,
            answer: faq.answer,
          }
        });
      }
    })
  );

  return result;
}



  static async deleteFAQ(id: number) {
    return await db.fAQ.delete({
      where: { id },
    });
  }
}

export default TermsPrivacyService 