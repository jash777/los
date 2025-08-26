const express = require('express');
const pool = require('../../middleware/config/database');
const crypto = require('crypto');
const { authenticateToken } = require('../../middleware/auth');
const { logAudit } = require('../../middleware/utils/audit');

const router = express.Router();

// Generate mock agreement and send OTP
router.post('/initiate/:offerId', authenticateToken, async (req, res) => {
  try {
    const { offerId } = req.params;

    // Get offer details
    const offerResult = await pool.query(
      'SELECT * FROM loan_offers WHERE id = $1 AND status = $2',
      [offerId, 'accepted']
    );

    if (offerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Accepted loan offer not found' });
    }

    const offer = offerResult.rows[0];

    // Check if e-sign already exists
    const existing = await pool.query(
      'SELECT * FROM esign_records WHERE loan_offer_id = $1',
      [offerId]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    // Generate mock OTP (in real scenario, this would be sent via SMS)
    const mockOTP = '1234';
    const agreementPath = `agreements/agreement_${offerId}_${Date.now()}.pdf`;

    const result = await pool.query(`
      INSERT INTO esign_records (
        application_id, loan_offer_id, agreement_path, otp_sent, status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      offer.application_id,
      offerId,
      agreementPath,
      mockOTP,
      'otp_sent'
    ]);

    await logAudit(offer.application_id, req.user.id, 'E-sign Initiated', req.user.role, {
      offer_id: offerId
    });

    res.json({
      ...result.rows[0],
      message: 'OTP sent successfully. Use 1234 for testing.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP and complete e-sign
router.post('/verify/:esignId', authenticateToken, async (req, res) => {
  try {
    const { esignId } = req.params;
    const { otp } = req.body;

    const result = await pool.query(
      'SELECT * FROM esign_records WHERE id = $1',
      [esignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'E-sign record not found' });
    }

    const esignRecord = result.rows[0];

    if (esignRecord.otp_sent !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (esignRecord.otp_verified) {
      return res.status(400).json({ error: 'OTP already verified' });
    }

    // Update e-sign record
    const updateResult = await pool.query(`
      UPDATE esign_records 
      SET otp_verified = true, signed_at = CURRENT_TIMESTAMP, status = 'signed'
      WHERE id = $1
      RETURNING *
    `, [esignId]);

    // Update application status to disbursed
    await pool.query(
      'UPDATE loan_applications SET status = $1 WHERE id = $2',
      ['disbursed', esignRecord.application_id]
    );

    await logAudit(esignRecord.application_id, req.user.id, 'E-sign Completed', req.user.role, {
      esign_id: esignId
    });

    res.json({
      ...updateResult.rows[0],
      message: 'E-sign completed successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get e-sign status
router.get('/:applicationId', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const result = await pool.query(
      'SELECT * FROM esign_records WHERE application_id = $1',
      [applicationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'E-sign record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;