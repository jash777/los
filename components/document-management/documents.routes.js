/**
 * @swagger
 * components:
 *   schemas:
 *     Document:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the document
 *         applicationId:
 *           type: integer
 *           description: ID of the associated loan application
 *         fileName:
 *           type: string
 *           description: Original name of the uploaded file
 *         filePath:
 *           type: string
 *           description: Server path where the file is stored
 *         fileType:
 *           type: string
 *           description: MIME type of the file
 *         fileSize:
 *           type: integer
 *           description: Size of the file in bytes
 *         documentType:
 *           type: string
 *           enum: [identity_proof, address_proof, income_proof, bank_statement, other]
 *           description: Category of the document
 *         uploadedBy:
 *           type: integer
 *           description: ID of the user who uploaded the document
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the document was uploaded
 *         verified:
 *           type: boolean
 *           description: Whether the document has been verified
 *         verifiedBy:
 *           type: integer
 *           nullable: true
 *           description: ID of the user who verified the document
 *         verifiedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp when the document was verified
 *       example:
 *         id: 1
 *         applicationId: 123
 *         fileName: "passport.pdf"
 *         filePath: "/uploads/documents/passport_123_1640995200000.pdf"
 *         fileType: "application/pdf"
 *         fileSize: 2048576
 *         documentType: "identity_proof"
 *         uploadedBy: 456
 *         uploadedAt: "2023-01-01T10:00:00Z"
 *         verified: true
 *         verifiedBy: 789
 *         verifiedAt: "2023-01-01T11:00:00Z"
 *     DocumentUploadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Document uploaded successfully"
 *         document:
 *           $ref: '#/components/schemas/Document'
 *     DocumentsList:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         documents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Document'
 *         count:
 *           type: integer
 *           description: Total number of documents
 *           example: 5
 */

const express = require('express');
const pool = require('../../middleware/config/database');
const { upload } = require('../../middleware/upload');
const { authenticateToken } = require('../../middleware/auth');
const { logAudit } = require('../../middleware/utils/audit');

const router = express.Router();

/**
 * @swagger
 * /api/documents/upload/{applicationId}:
 *   post:
 *     summary: Upload a document for a loan application
 *     description: Upload and store a document file associated with a specific loan application
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the loan application
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: The document file to upload
 *               documentType:
 *                 type: string
 *                 enum: [identity_proof, address_proof, income_proof, bank_statement, other]
 *                 description: Category of the document being uploaded
 *             required:
 *               - document
 *               - documentType
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentUploadResponse'
 *       400:
 *         description: Bad request - Invalid file or missing data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       413:
 *         description: File too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       415:
 *         description: Unsupported file type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Upload document
router.post('/upload/:applicationId', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { document_type } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await pool.query(`
      INSERT INTO loan_documents (application_id, document_type, file_name, file_path, file_size, mime_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      applicationId,
      document_type,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype
    ]);

    await logAudit(applicationId, req.user.id, 'Document Uploaded', req.user.role, {
      document_type,
      file_name: req.file.originalname
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/documents/application/{applicationId}:
 *   get:
 *     summary: Get all documents for a loan application
 *     description: Retrieve all documents associated with a specific loan application
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the loan application
 *       - in: query
 *         name: documentType
 *         schema:
 *           type: string
 *           enum: [identity_proof, address_proof, income_proof, bank_statement, other]
 *         description: Filter documents by type
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Filter documents by verification status
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentsList'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Application not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get documents for application
router.get('/application/:applicationId', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const result = await pool.query(
      'SELECT * FROM loan_documents WHERE application_id = $1 ORDER BY uploaded_at DESC',
      [applicationId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     description: Delete a specific document by its ID (removes both database record and file)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique identifier of the document to delete
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Document deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Cannot delete document belonging to another user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Delete document
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM loan_documents WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;