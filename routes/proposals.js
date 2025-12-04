import express from 'express';
import { Proposals } from '../models/proposals.js';
import { systemPromptForAnalyzingProposalEmail } from '../helpers/systemPrompts.js';
import { logtail } from '../helpers/logger.js';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const router = express.Router();

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

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const proposalsForRfp = await Proposals.findById(id).sort({ createdAt: -1 });

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

            const sender = email?.from;
            const subject = email?.subject;
            const textBody = email?.text; // or email.html
            const attachments = email?.attachments;

            console.log('Email received:', email);
            console.log('Text Body:', email?.text);
            console.log('HTML Body:', email?.html);
            console.log('Subject', email?.subject);

            const proposalObject = await getProposalDetailsFromEmail(textBody);

            await Proposals.create({
                emailBody: textBody,
                ...proposalObject
            });

            return res.status(201).json({
                message: 'Proposal data saved successfully',
                data: proposalObject
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

export default router;