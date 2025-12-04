import express from 'express';
import { Proposals } from '../models/proposals.js';
import { systemPromptForAnalyzingProposalEmail } from '../helpers/systemPrompts.js';
import { logtail } from '../helpers/logger.js';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { resend, sendEmailForConfirmingOrder } from '../helpers/sendEmails.js';
import { Rfp } from '../models/rfp.js';

dotenv.config();

const router = express.Router();

const fetchFullEmailFromResend = async (emailId) => {
    try {
        const { data } = await resend.emails.receiving.get(emailId);

        console.log('Fetched email data from Resend:', data);
        return data;

    } catch (error) {
        console.error('Error fetching email from Resend:', error);
        return {};
    }
};

const getProposalDetailsFromEmail = async (emailData) => {
    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });

    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
            thinkingConfig: {
                thinkingBudget: 0,
            },
            systemInstruction: systemPromptForAnalyzingProposalEmail
        },
        contents: emailData
    });

    return JSON.parse(result.text.substring(13, result.text.length - 3));
};

router.get('/', async (req, res) => {
    try {
        const proposalsForRfp = await Proposals.find({}).sort({ createdAt: -1 });

        return res.status(201).json({
            message: 'Vendors fetched successfully',
            data: proposalsForRfp
        });
    } catch (error) {
        console.error('Error fetching proposals:', error);
        return res.status(500).json({
            message: 'Error fetching proposals for given RFP',
            error: error.message
        });
    }
});

router.post('/', async (req, res) => {
    try {
        const payload = req.body;

        if (payload.type === 'email.received') {

            logtail.info("Received email", {
                message: "Email",
                data: payload?.data
            });

            const email = payload?.data;

            const fullEmail = await fetchFullEmailFromResend(email?.email_id);
            console.log('Full email fetched from Resend:', fullEmail);

            const proposalObject = await getProposalDetailsFromEmail(fullEmail?.html);

            console.log('Extracted Proposal Object:', proposalObject);
            const savedProposal = await Proposals.create({
                emailBody: fullEmail?.text,
                ...proposalObject
            });

            if (savedProposal?.id) {
                await Rfp.findOneAndUpdate(
                    {},
                    {
                        $push: {
                            proposalIds: savedProposal.id.toString()
                        }
                    },
                    { new: true }
                );
            }

            return res.status(201).json({
                message: 'Proposal data saved successfully',
                data: []
            });
        }

    } catch (error) {
        console.error('Error fetching proposal:', error);
        return res.status(500).json({
            message: 'Error saving proposal data',
            error: error.message
        });
    }
});

router.post('/placeOrder/:id', async (req, res) => {
    try {
        const { senderName } = req.body;
        const {id} = req.params;

        await sendEmailForConfirmingOrder(senderName);
        await Proposals.findOneAndUpdate(
            { id },
            {orderConfirmed: true},
            {new: true}
        );  

        return res.status(201).json({
            message: `Email for order confirmation sent successfully to ${senderName}`,
        });
    }

    catch (error) {
        console.error('Error sending email for proposal:', error);
        return res.status(500).json({
            message: 'Error sending email for proposal for placing order',
            error: error.message
        });
    }
})

export default router;