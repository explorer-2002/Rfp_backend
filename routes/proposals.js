import express from 'express';
import { Proposals } from '../models/proposals.js';

const router = express.Router();

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
            const email = payload.data;

            const sender = email.from;
            const subject = email.subject;
            const textBody = email.text; // or email.html
            const attachments = email.attachments;

            console.log(`Received email from ${sender}: ${subject}`);
            console.log(`Body: ${textBody}`);
            console.log(`Attachments: ${attachments.length} files`);

            return res.status(201).json({
                status: "ok",
            });
        }

        } catch (error) {
            console.error('Error fetching proposal:', error);
            return res.status(500).json({
                message: 'Error receiving proposal email',
                error: error.message
            });
        }
    });

export default router;